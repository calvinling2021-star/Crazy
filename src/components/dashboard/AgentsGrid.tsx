"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ScaleIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type AgentConfig = {
  id: string;
  agentType: string;
  label: string;
  description: string;
  systemPrompt: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ACCOUNTING: CalculatorIcon,
  AUDIT_PREP: ClipboardDocumentCheckIcon,
  DOC_PREP: DocumentTextIcon,
  IR: ChartBarIcon,
  LEGAL: ScaleIcon,
};

export default function AgentsGrid({ isPrincipal }: { isPrincipal: boolean }) {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AgentConfig | null>(null);
  const [form, setForm] = useState({ label: "", description: "", systemPrompt: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/agents/config");
    if (res.ok) setConfigs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(cfg: AgentConfig) {
    setForm({ label: cfg.label, description: cfg.description, systemPrompt: cfg.systemPrompt });
    setEditing(cfg);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/agents/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentType: editing.agentType, ...form }),
    });
    if (res.ok) {
      await load();
      setEditing(null);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600 text-sm">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Powered by Claude</p>
        <h1 className="text-white text-2xl font-light">AI Agents</h1>
        <p className="text-gray-500 text-sm mt-2">Select an agent to start a conversation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {configs.map((cfg) => {
          const Icon = ICONS[cfg.agentType] ?? DocumentTextIcon;
          return (
            <div key={cfg.agentType} className="relative group">
              <Link
                href={`/dashboard/agents/${cfg.agentType.toLowerCase()}`}
                className="bg-[#111] border border-gray-800 px-6 py-5 hover:border-[#c9a84c]/50 hover:bg-[#131313] transition-all flex items-start gap-4 block"
              >
                <div className="w-9 h-9 bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#c9a84c]/40 transition-colors">
                  <Icon className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{cfg.label}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{cfg.description}</p>
                </div>
              </Link>
              {isPrincipal && (
                <button
                  onClick={(e) => { e.preventDefault(); openEdit(cfg); }}
                  className="absolute top-3 right-3 text-gray-600 hover:text-[#c9a84c] transition-colors p-1.5 bg-[#111] border border-transparent hover:border-gray-700 rounded"
                  title="Edit agent"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <div>
                <p className="text-[#c9a84c] text-[10px] tracking-widest uppercase mb-0.5">Edit Agent</p>
                <h2 className="text-white text-lg font-light">{editing.agentType}</h2>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">System Prompt</label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  rows={16}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors resize-none font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.label || !form.systemPrompt}
                className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2.5 hover:bg-[#b8972e] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
