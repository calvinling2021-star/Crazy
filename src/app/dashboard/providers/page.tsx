"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, StarIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type Provider = {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  contact: string | null;
  email: string | null;
  pricing: string | null;
  notes: string | null;
};

const TYPES = ["LAW_FIRM", "AUDITOR", "TRANSFER_AGENT", "IR_FIRM"];
const TYPE_LABELS: Record<string, string> = {
  LAW_FIRM: "Law Firm",
  AUDITOR: "Auditor",
  TRANSFER_AGENT: "Transfer Agent",
  IR_FIRM: "IR Firm",
};
const TYPE_COLORS: Record<string, string> = {
  LAW_FIRM: "text-blue-400 border-blue-900 bg-blue-900/20",
  AUDITOR: "text-purple-400 border-purple-900 bg-purple-900/20",
  TRANSFER_AGENT: "text-cyan-400 border-cyan-900 bg-cyan-900/20",
  IR_FIRM: "text-orange-400 border-orange-900 bg-orange-900/20",
};

const EMPTY_FORM = { name: "", type: "LAW_FIRM", rating: "", contact: "", email: "", pricing: "", notes: "" };

export default function ProvidersPage() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = session?.user.role !== "ASSET_CEO";
  const canDelete = session?.user.role === "PRINCIPAL";

  async function load() {
    const res = await fetch("/api/providers");
    if (res.ok) setProviders(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? providers : providers.filter((p) => p.type === filter);

  function openAdd() { setForm(EMPTY_FORM); setModal("add"); }
  function openEdit(p: Provider) {
    setForm({ name: p.name, type: p.type, rating: p.rating ? String(p.rating) : "", contact: p.contact ?? "", email: p.email ?? "", pricing: p.pricing ?? "", notes: p.notes ?? "" });
    setEditId(p.id);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const method = modal === "add" ? "POST" : "PATCH";
    const body = {
      ...(modal === "edit" ? { id: editId } : {}),
      ...form,
      rating: form.rating ? Number(form.rating) : null,
    };
    const res = await fetch("/api/providers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setModal(null); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this provider?")) return;
    await fetch(`/api/providers?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Registry</p>
          <h1 className="text-white text-2xl font-light">Service Providers</h1>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-[#b8972e] transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Provider
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", ...TYPES].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={clsx("text-xs tracking-widest uppercase px-4 py-2 border transition-colors",
              filter === t ? "border-[#c9a84c] text-[#c9a84c]" : "border-gray-700 text-gray-500 hover:text-white")}>
            {t === "ALL" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm">No providers yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="bg-[#111] border border-gray-800 px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <span className={clsx("text-[10px] tracking-wider uppercase px-2 py-0.5 border rounded-sm", TYPE_COLORS[p.type])}>
                    {TYPE_LABELS[p.type]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  {p.contact && <span>{p.contact}</span>}
                  {p.email && <span>{p.email}</span>}
                  {p.pricing && <span className="text-gray-400">{p.pricing}</span>}
                </div>
                {p.notes && <p className="text-gray-600 text-xs mt-1.5 line-clamp-2">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {p.rating !== null && (
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3.5 h-3.5 text-[#c9a84c]" />
                    <span className="text-[#c9a84c] text-xs">{p.rating.toFixed(1)}</span>
                  </div>
                )}
                {canEdit && (
                  <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-[#c9a84c] transition-colors p-1">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-light">{modal === "add" ? "New Provider" : "Edit Provider"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <Field label="Rating (1-5)" value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              <Field label="Contact Person" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Pricing" value={form.pricing} onChange={(v) => setForm({ ...form, pricing: v })} />
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2.5 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
    </div>
  );
}
