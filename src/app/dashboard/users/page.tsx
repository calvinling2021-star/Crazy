"use client";

import { useEffect, useState } from "react";
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

type User = { id: string; name: string; email: string; role: string; createdAt: string };

const ROLES = ["PRINCIPAL", "OPS", "ASSET_CEO"];
const ROLE_LABELS: Record<string, string> = { PRINCIPAL: "Principal", OPS: "Operations", ASSET_CEO: "Asset CEO" };
const ROLE_COLORS: Record<string, string> = {
  PRINCIPAL: "text-[#c9a84c] border-[#c9a84c]/30 bg-[#c9a84c]/10",
  OPS: "text-blue-400 border-blue-900 bg-blue-900/20",
  ASSET_CEO: "text-gray-300 border-gray-700 bg-gray-800/30",
};

const EMPTY_FORM = { name: "", email: "", role: "ASSET_CEO", password: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setModal("add"); }
  function openEdit(u: User) {
    setForm({ name: u.name, email: u.email, role: u.role, password: "" });
    setEditId(u.id);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const method = modal === "add" ? "POST" : "PATCH";
    const body = modal === "edit"
      ? { id: editId, name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
      : form;
    const res = await fetch("/api/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setModal(null); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Access</p>
          <h1 className="text-white text-2xl font-light">Team Members</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-[#b8972e] transition-colors">
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-[#111] border border-gray-800 px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{u.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
              </div>
              <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 border rounded-sm ${ROLE_COLORS[u.role]}`}>
                {ROLE_LABELS[u.role]}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(u)} className="text-gray-500 hover:text-[#c9a84c] transition-colors p-1">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(u.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-light">{modal === "add" ? "New User" : "Edit User"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <Field label={modal === "add" ? "Password" : "New Password (leave blank to keep)"} value={form.password} onChange={(v) => setForm({ ...form, password: v })} required={modal === "add"} type="password" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email}
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

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
    </div>
  );
}
