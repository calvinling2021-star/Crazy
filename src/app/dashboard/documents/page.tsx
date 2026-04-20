"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUpTrayIcon, TrashIcon, ArrowDownTrayIcon,
  DocumentIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

type UploadedFile = {
  id: string; filename: string; mimeType: string; sizeBytes: number;
  source: string; createdAt: string;
  user: { name: string }; deal: { name: string } | null;
};
type Deal = { id: string; name: string };

const SOURCE_COLORS: Record<string, string> = {
  upload: "text-gray-400 border-gray-700",
  gmail: "text-red-400 border-red-900",
  outlook: "text-blue-400 border-blue-900",
  zoom: "text-blue-300 border-blue-800",
  telegram: "text-sky-400 border-sky-900",
  whatsapp: "text-green-400 border-green-900",
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [modal, setModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [fr, dr] = await Promise.all([fetch("/api/files"), fetch("/api/deals")]);
    if (fr.ok) setFiles(await fr.json());
    if (dr.ok) setDeals(await dr.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openUpload(files?: File[]) {
    if (files?.length) setPending(files);
    setModal(true);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) openUpload(dropped);
  }

  async function handleUpload() {
    if (!pending.length) return;
    setUploading(true);
    for (const file of pending) {
      const fd = new FormData();
      fd.append("file", file);
      if (selectedDeal) fd.append("dealId", selectedDeal);
      await fetch("/api/files/upload", { method: "POST", body: fd });
    }
    setPending([]); setSelectedDeal(""); setModal(false);
    setUploading(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Library</p>
          <h1 className="text-white text-2xl font-light">Documents</h1>
        </div>
        <button
          onClick={() => openUpload()}
          className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-[#b8972e] transition-colors"
        >
          <ArrowUpTrayIcon className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => { setPending([]); openUpload(); }}
        className={clsx(
          "border-2 border-dashed rounded-sm py-8 text-center cursor-pointer transition-colors mb-6",
          dragOver ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-800 hover:border-gray-600"
        )}
      >
        <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-600 mb-2" />
        <p className="text-gray-500 text-sm">Drop files here or click to upload</p>
        <p className="text-gray-700 text-xs mt-1">PDF, Word, Excel, PowerPoint, WPS, images, audio, video — up to 50 MB</p>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-600 text-sm">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="bg-[#111] border border-gray-800 px-5 py-4 flex items-center gap-4">
              <DocumentIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{f.filename}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                  <span>{formatBytes(f.sizeBytes)}</span>
                  {f.deal && <span className="text-gray-400">→ {f.deal.name}</span>}
                  <span>{f.user.name}</span>
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={clsx("text-[10px] tracking-wider uppercase px-2 py-0.5 border rounded-sm", SOURCE_COLORS[f.source] ?? "text-gray-500 border-gray-700")}>
                {f.source}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`/api/files/${f.id}?download=1`}
                  className="text-gray-500 hover:text-[#c9a84c] transition-colors p-1.5"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1.5"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-light">Upload Files</h2>
              <button onClick={() => { setModal(false); setPending([]); }} className="text-gray-500 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className={clsx(
                "border-2 border-dashed py-6 text-center cursor-pointer rounded-sm mb-4 transition-colors",
                pending.length ? "border-[#c9a84c]/50" : "border-gray-700 hover:border-gray-500"
              )}
            >
              {pending.length ? (
                <p className="text-[#c9a84c] text-sm">{pending.length} file{pending.length > 1 ? "s" : ""} selected</p>
              ) : (
                <p className="text-gray-500 text-sm">Click to choose files</p>
              )}
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) setPending(Array.from(e.target.files)); }}
              />
            </div>

            {pending.length > 0 && (
              <ul className="space-y-1 mb-4 max-h-32 overflow-y-auto">
                {pending.map((f, i) => (
                  <li key={i} className="text-gray-400 text-xs truncate">{f.name} ({formatBytes(f.size)})</li>
                ))}
              </ul>
            )}

            <div className="mb-4">
              <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Attach to Deal (optional)</label>
              <select
                value={selectedDeal}
                onChange={(e) => setSelectedDeal(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
              >
                <option value="">— No deal —</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setModal(false); setPending([]); }} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleUpload} disabled={uploading || !pending.length} className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2.5 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
