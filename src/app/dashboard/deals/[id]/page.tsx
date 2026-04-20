"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

type Owner = { id: string; name: string; email: string };
type Assignee = { id: string; name: string } | null;

type UploadedFile = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  source: string;
  createdAt: string;
  user: { name: string };
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  assignee: Assignee;
  dueDate: string | null;
  createdAt: string;
};

type Provider = {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  contact: string | null;
  email: string | null;
};

type Deal = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  sector: string | null;
  stage: string | null;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  uploadedFiles: UploadedFile[];
  tasks: Task[];
  dealProviders: { provider: Provider }[];
};

type AgentMsg = { role: "user" | "assistant"; content: string };
type AllProvider = { id: string; name: string; type: string };
type TeamUser = { id: string; name: string; role: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["ACTIVE", "PENDING", "CLOSED", "ON_HOLD"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-900/30 text-green-400 border border-green-900",
  PENDING: "bg-yellow-900/30 text-yellow-400 border border-yellow-900",
  CLOSED: "bg-gray-800 text-gray-500 border border-gray-700",
  ON_HOLD: "bg-orange-900/30 text-orange-400 border border-orange-900",
};
const TASK_STATUS_COLORS: Record<string, string> = {
  OPEN: "text-gray-400",
  IN_PROGRESS: "text-yellow-400",
  DONE: "text-green-400",
  BLOCKED: "text-red-400",
};
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-red-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-gray-500",
};
const AGENTS = [
  { key: "ACCOUNTING", label: "Accounting" },
  { key: "AUDIT_PREP", label: "Audit Prep" },
  { key: "DOC_PREP", label: "Doc Prep" },
  { key: "IR", label: "IR" },
  { key: "LEGAL", label: "Legal" },
];

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const isPrincipal = role === "PRINCIPAL";
  const isOps = role === "OPS";
  const canManage = isPrincipal || isOps;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "documents" | "tasks" | "providers" | "chat">("overview");

  async function loadDeal() {
    const res = await fetch(`/api/deals/${id}`);
    if (res.ok) setDeal(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadDeal(); }, [id]);

  if (loading) return <div className="p-8 text-gray-600 text-sm">Loading...</div>;
  if (!deal) return <div className="p-8 text-gray-500 text-sm">Deal not found.</div>;

  const tabs = [
    { key: "overview", label: "Overview", icon: DocumentTextIcon },
    { key: "documents", label: "Documents", icon: PaperClipIcon },
    { key: "tasks", label: "Tasks", icon: CheckCircleIcon },
    { key: "providers", label: "Providers", icon: UserGroupIcon },
    { key: "chat", label: "AI Chat", icon: ChatBubbleLeftRightIcon },
  ] as const;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => router.push("/dashboard/deals")} className="mt-1 text-gray-500 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Deal</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-white text-2xl font-light">{deal.name}</h1>
            <span className={`text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm ${STATUS_COLORS[deal.status]}`}>
              {deal.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {deal.owner.name}
            {deal.sector && <> · {deal.sector}</>}
            {deal.stage && <> · {deal.stage}</>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-800 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-[#c9a84c] text-[#c9a84c]"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab deal={deal} canManage={canManage} onUpdated={loadDeal} />}
      {tab === "documents" && <DocumentsTab deal={deal} canManage={canManage} onUpdated={loadDeal} />}
      {tab === "tasks" && <TasksTab deal={deal} role={role} onUpdated={loadDeal} />}
      {tab === "providers" && <ProvidersTab deal={deal} canManage={canManage} onUpdated={loadDeal} />}
      {tab === "chat" && <ChatTab dealId={deal.id} dealName={deal.name} userId={session?.user?.id ?? ""} />}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ deal, canManage, onUpdated }: { deal: Deal; canManage: boolean; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: deal.name, status: deal.status,
    description: deal.description ?? "", sector: deal.sector ?? "", stage: deal.stage ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) { await onUpdated(); setEditing(false); }
    setSaving(false);
  }

  if (editing) {
    return (
      <div className="bg-[#111] border border-gray-800 p-6 max-w-lg space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-medium">Edit Deal</p>
          <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <OField label="Deal Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <div>
          <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <OField label="Sector" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
        <OField label="Stage" value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} />
        <div>
          <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
            className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setEditing(false)} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2 hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <Row label="Status">
              <span className={`text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm ${STATUS_COLORS[deal.status]}`}>
                {deal.status.replace("_", " ")}
              </span>
            </Row>
            {deal.sector && <Row label="Sector"><span className="text-white text-sm">{deal.sector}</span></Row>}
            {deal.stage && <Row label="Stage"><span className="text-white text-sm">{deal.stage}</span></Row>}
            <Row label="Owner"><span className="text-white text-sm">{deal.owner.name}</span></Row>
            <Row label="Created">
              <span className="text-gray-400 text-sm">{new Date(deal.createdAt).toLocaleDateString()}</span>
            </Row>
            {deal.description && (
              <div>
                <p className="text-xs text-gray-500 tracking-widest uppercase mb-2">Description</p>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}
          </div>
          {canManage && (
            <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-[#c9a84c] transition-colors p-1 ml-4">
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Documents" value={deal.uploadedFiles.length} />
        <StatCard label="Tasks" value={deal.tasks.length} sub={`${deal.tasks.filter((t) => t.status === "DONE").length} done`} />
        <StatCard label="Providers" value={deal.dealProviders.length} />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 tracking-widest uppercase w-24 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-[#111] border border-gray-800 p-4">
      <p className="text-gray-500 text-xs tracking-widest uppercase mb-1">{label}</p>
      <p className="text-white text-2xl font-light">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function OField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ deal, canManage, onUpdated }: { deal: Deal; canManage: boolean; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dealId", deal.id);
    fd.append("source", "deal_upload");
    await fetch("/api/files/upload", { method: "POST", body: fd });
    await onUpdated();
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    await onUpdated();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs tracking-widest uppercase">{deal.uploadedFiles.length} file{deal.uploadedFiles.length !== 1 ? "s" : ""}</p>
        {canManage && (
          <>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>

      {deal.uploadedFiles.length === 0 ? (
        <p className="text-gray-600 text-sm">No files uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {deal.uploadedFiles.map((f) => (
            <div key={f.id} className="bg-[#111] border border-gray-800 px-4 py-3 flex items-center gap-3">
              <PaperClipIcon className="w-4 h-4 text-gray-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                  className="text-white text-sm hover:text-[#c9a84c] transition-colors truncate block">
                  {f.filename}
                </a>
                <p className="text-gray-600 text-xs mt-0.5">
                  {fmt(f.sizeBytes)} · {f.user.name} · {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              <a href={`/api/files/${f.id}?download=1`}
                className="text-gray-500 hover:text-[#c9a84c] transition-colors text-xs tracking-widest uppercase shrink-0">
                Download
              </a>
              {canManage && (
                <button onClick={() => handleDelete(f.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0">
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ deal, role, onUpdated }: { deal: Deal; role: string; onUpdated: () => void }) {
  const canManage = role === "PRINCIPAL" || role === "OPS";
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", status: "OPEN", priority: "MEDIUM", assigneeId: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => {});
  }, []);

  async function addTask() {
    setSaving(true);
    await fetch(`/api/deals/${deal.id}/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null }),
    });
    await onUpdated();
    setModal(false);
    setForm({ title: "", status: "OPEN", priority: "MEDIUM", assigneeId: "", dueDate: "" });
    setSaving(false);
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === "DONE" ? "OPEN" : "DONE";
    await fetch(`/api/deals/${deal.id}/tasks/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
    });
    await onUpdated();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete task?")) return;
    await fetch(`/api/deals/${deal.id}/tasks/${taskId}`, { method: "DELETE" });
    await onUpdated();
  }

  const open = deal.tasks.filter((t) => t.status !== "DONE");
  const done = deal.tasks.filter((t) => t.status === "DONE");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs tracking-widest uppercase">
          {open.length} open · {done.length} done
        </p>
        {canManage && (
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#b8972e] transition-colors">
            <PlusIcon className="w-3.5 h-3.5" /> Add Task
          </button>
        )}
      </div>

      {deal.tasks.length === 0 ? (
        <p className="text-gray-600 text-sm">No tasks yet.</p>
      ) : (
        <div className="space-y-1">
          {[...open, ...done].map((task) => (
            <div key={task.id} className={`bg-[#111] border border-gray-800 px-4 py-3 flex items-center gap-3 ${task.status === "DONE" ? "opacity-50" : ""}`}>
              <button onClick={() => toggleDone(task)} className="shrink-0">
                {task.status === "DONE"
                  ? <CheckCircleSolid className="w-5 h-5 text-green-500" />
                  : <div className="w-5 h-5 rounded-full border-2 border-gray-600 hover:border-[#c9a84c] transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === "DONE" ? "line-through text-gray-500" : "text-white"}`}>{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs ${TASK_STATUS_COLORS[task.status] ?? "text-gray-400"}`}>{task.status.replace("_", " ")}</span>
                  <span className={`text-xs ${PRIORITY_COLORS[task.priority] ?? "text-gray-400"}`}>{task.priority}</span>
                  {task.assignee && <span className="text-gray-600 text-xs">{task.assignee.name}</span>}
                  {task.dueDate && (
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0">
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-light">New Task</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <OField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                    {["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                    {["HIGH", "MEDIUM", "LOW"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Assignee</label>
                <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]">
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors">Cancel</button>
              <button onClick={addTask} disabled={saving || !form.title}
                className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2.5 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Providers Tab ────────────────────────────────────────────────────────────

function ProvidersTab({ deal, canManage, onUpdated }: { deal: Deal; canManage: boolean; onUpdated: () => void }) {
  const [allProviders, setAllProviders] = useState<AllProvider[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  const assignedIds = new Set(deal.dealProviders.map((dp) => dp.provider.id));
  const available = allProviders.filter((p) => !assignedIds.has(p.id));

  useEffect(() => {
    if (canManage) {
      fetch("/api/providers").then((r) => r.ok ? r.json() : []).then(setAllProviders).catch(() => {});
    }
  }, [canManage]);

  async function assign() {
    if (!selectedId) return;
    setSaving(true);
    await fetch(`/api/deals/${deal.id}/providers`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId: selectedId }),
    });
    await onUpdated();
    setAdding(false);
    setSelectedId("");
    setSaving(false);
  }

  async function remove(providerId: string) {
    if (!confirm("Remove this provider from deal?")) return;
    await fetch(`/api/deals/${deal.id}/providers`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId }),
    });
    await onUpdated();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs tracking-widest uppercase">{deal.dealProviders.length} assigned</p>
        {canManage && !adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#b8972e] transition-colors">
            <PlusIcon className="w-3.5 h-3.5" /> Add Provider
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-[#111] border border-gray-800 p-4 mb-4 flex items-center gap-3">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]">
            <option value="">Select provider...</option>
            {available.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
          </select>
          <button onClick={assign} disabled={saving || !selectedId}
            className="bg-[#c9a84c] text-black text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#b8972e] disabled:opacity-50 transition-colors">
            {saving ? "..." : "Add"}
          </button>
          <button onClick={() => { setAdding(false); setSelectedId(""); }} className="text-gray-500 hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {deal.dealProviders.length === 0 ? (
        <p className="text-gray-600 text-sm">No providers assigned.</p>
      ) : (
        <div className="space-y-2">
          {deal.dealProviders.map(({ provider }) => (
            <div key={provider.id} className="bg-[#111] border border-gray-800 px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{provider.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">{provider.type}</span>
                  {provider.rating && <span className="text-[#c9a84c] text-xs">{provider.rating.toFixed(1)} ★</span>}
                  {provider.contact && <span className="text-gray-600 text-xs">{provider.contact}</span>}
                </div>
              </div>
              {provider.email && (
                <a href={`mailto:${provider.email}`} className="text-gray-500 hover:text-[#c9a84c] text-xs transition-colors shrink-0">
                  {provider.email}
                </a>
              )}
              {canManage && (
                <button onClick={() => remove(provider.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ dealId, dealName, userId }: { dealId: string; dealName: string; userId: string }) {
  const [agent, setAgent] = useState("ACCOUNTING");
  const [messages, setMessages] = useState<AgentMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: AgentMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const context = `[Deal: ${dealName} (ID: ${dealId})] ` + text;

    const res = await fetch("/api/agents/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentType: agent, message: context, sessionId, userId }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      {/* Agent selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {AGENTS.map((a) => (
          <button key={a.key} onClick={() => { setAgent(a.key); setMessages([]); }}
            className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${
              agent === a.key ? "border-[#c9a84c] text-[#c9a84c]" : "border-gray-700 text-gray-500 hover:text-white hover:border-gray-500"
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm">
            Ask the {AGENTS.find((a) => a.key === agent)?.label} agent about this deal.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-white"
                : "bg-[#111] border border-gray-800 text-gray-200"
            }`}>
              {m.role === "assistant" && (
                <p className="text-[10px] text-[#c9a84c] tracking-widest uppercase mb-1">
                  {AGENTS.find((a) => a.key === agent)?.label}
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-gray-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Ask about ${dealName}...`}
          rows={2}
          className="flex-1 bg-[#111] border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c] resize-none transition-colors placeholder-gray-600"
        />
        <button onClick={send} disabled={sending || !input.trim()}
          className="bg-[#c9a84c] text-black px-4 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
          <CheckIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
