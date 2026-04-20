"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Deal = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  sector: string | null;
  stage: string | null;
  owner: { name: string; email: string };
  updatedAt: string;
};

const STATUSES = ["ACTIVE", "PENDING", "CLOSED", "ON_HOLD"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-900/30 text-green-400 border border-green-900",
  PENDING: "bg-yellow-900/30 text-yellow-400 border border-yellow-900",
  CLOSED: "bg-gray-800 text-gray-500 border border-gray-700",
  ON_HOLD: "bg-orange-900/30 text-orange-400 border border-orange-900",
};

const EMPTY_FORM = { name: "", status: "ACTIVE", description: "", sector: "", stage: "" };

export default function DealsPage() {
  const { data: session } = useSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = session?.user.role !== "ASSET_CEO" || true;
  const canDelete = session?.user.role === "PRINCIPAL" || session?.user.role === "OPS";

  async function load() {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setModal("add"); }
  function openEdit(deal: Deal) {
    setForm({ name: deal.name, status: deal.status, description: deal.description ?? "", sector: deal.sector ?? "", stage: deal.stage ?? "" });
    setEditId(deal.id);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const method = modal === "add" ? "POST" : "PATCH";
    const body = modal === "edit" ? { id: editId, ...form } : form;
    const res = await fetch("/api/deals", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setModal(null); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/deals?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Internal</p>
          <h1 className="text-white text-2xl font-light">Deals</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-[#b8972e] transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> Add Deal
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : deals.length === 0 ? (
        <p className="text-gray-600 text-sm">No deals yet.</p>
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-[#111] border border-gray-800 px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{deal.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-500 text-xs">{deal.owner.name}</p>
                  {deal.sector && <span className="text-gray-600 text-xs">{deal.sector}</span>}
                  {deal.stage && <span className="text-gray-600 text-xs">{deal.stage}</span>}
                </div>
              </div>
              <span className={`text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm ${STATUS_COLORS[deal.status]}`}>
                {deal.status.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(deal)} className="text-gray-500 hover:text-[#c9a84c] transition-colors p-1">
                  <PencilIcon className="w-4 h-4" />
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(deal.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
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
          <div className="bg-[#111] border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-light">{modal === "add" ? "New Deal" : "Edit Deal"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Deal Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <Field label="Sector" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
              <Field label="Stage" value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} />
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
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
