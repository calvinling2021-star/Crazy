"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Contact {
  id: number;
  ceo_id: number;
  channel: "email" | "linkedin";
  value: string;
  source: string;
  score: number | null;
}

interface Prospect {
  cik: string;
  ticker: string;
  name: string;
  market_cap: number;
  exchange: string | null;
  delinquency_score: number;
  signal_types: string | null;
  ceo_id: number | null;
  ceo_name: string | null;
  ceo_title: string | null;
  ceo_conf: number | null;
  notes: string | null;
  contacts: Contact[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCap(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function bestContact(
  contacts: Contact[],
  channel: "email" | "linkedin"
): Contact | null {
  const ch = contacts.filter((c) => c.channel === channel);
  if (!ch.length) return null;
  return ch.sort((a, b) => {
    const rank = (s: string) => (s === "manual" ? 3 : s === "hunter" ? 2 : 1);
    return rank(b.source) - rank(a.source) || (b.score ?? 0) - (a.score ?? 0);
  })[0];
}

// ── Small UI pieces ───────────────────────────────────────────────────────────

function Badge({
  label,
  color,
}: {
  label: string;
  color: "green" | "blue" | "purple" | "gray";
}) {
  const cls = {
    green: "bg-green-900/60 text-green-300",
    blue: "bg-blue-900/60 text-blue-300",
    purple: "bg-purple-900/60 text-purple-300",
    gray: "bg-white/5 text-gray-400",
  }[color];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const color =
    source === "manual"
      ? "green"
      : source === "hunter"
      ? "blue"
      : source === "rocketreach"
      ? "purple"
      : "gray";
  return <Badge label={source} color={color} />;
}

function ScoreColor(score: number): string {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  return "text-yellow-400";
}

function ConfColor(conf: number): string {
  if (conf >= 70) return "text-green-400";
  if (conf >= 40) return "text-yellow-400";
  return "text-red-400";
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  prospect,
  onClose,
  onSaved,
}: {
  prospect: Prospect;
  onClose: () => void;
  onSaved: (updated: Prospect) => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [linkedinInput, setLinkedinInput] = useState("");
  const [notes, setNotes] = useState(prospect.notes ?? "");
  const [contacts, setContacts] = useState<Contact[]>(prospect.contacts);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const emails = contacts.filter((c) => c.channel === "email");
  const linkedins = contacts.filter((c) => c.channel === "linkedin");

  async function addContact(channel: "email" | "linkedin", value: string) {
    const v = value.trim();
    if (!v || !prospect.ceo_id) return;
    setErr("");
    const res = await fetch(`/api/ceo/${prospect.ceo_id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, value: v }),
    });
    if (!res.ok) {
      setErr("Failed to save contact.");
      return;
    }
    const newContact: Contact = await res.json();
    setContacts((prev) => [
      ...prev.filter(
        (c) => !(c.channel === channel && c.value === v)
      ),
      newContact,
    ]);
    if (channel === "email") setEmailInput("");
    else setLinkedinInput("");
  }

  async function removeContact(id: number) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function saveNotes() {
    if (!prospect.ceo_id) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/ceo/${prospect.ceo_id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved({ ...prospect, notes, contacts });
    } catch {
      setErr("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {prospect.ceo_name ?? "Unknown CEO"}
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {prospect.ticker} · {prospect.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-white text-2xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {err && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
            {err}
          </p>
        )}

        {/* Email */}
        <Section label="Email Addresses">
          <div className="space-y-1.5 mb-3">
            {emails.length === 0 && (
              <p className="text-xs text-[#6B7280]">No emails saved yet.</p>
            )}
            {emails.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                onDelete={removeContact}
                isLink={false}
              />
            ))}
          </div>
          <InputRow
            placeholder="name@company.com"
            value={emailInput}
            onChange={setEmailInput}
            onAdd={() => addContact("email", emailInput)}
          />
        </Section>

        {/* LinkedIn */}
        <Section label="LinkedIn Profiles">
          <div className="space-y-1.5 mb-3">
            {linkedins.length === 0 && (
              <p className="text-xs text-[#6B7280]">
                No LinkedIn profiles saved yet.
              </p>
            )}
            {linkedins.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                onDelete={removeContact}
                isLink
              />
            ))}
          </div>
          <InputRow
            placeholder="https://linkedin.com/in/…"
            value={linkedinInput}
            onChange={setLinkedinInput}
            onAdd={() => addContact("linkedin", linkedinInput)}
          />
        </Section>

        {/* Notes */}
        <Section label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Enter notes about this CEO or opportunity…"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C] resize-none"
          />
        </Section>

        <div className="flex gap-3 pt-1">
          <button
            onClick={saveNotes}
            disabled={saving}
            className="flex-1 py-2 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#D4B85A] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Notes"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 border border-white/10 text-[#9CA3AF] text-sm rounded-lg hover:border-white/20 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function ContactRow({
  contact,
  onDelete,
  isLink,
}: {
  contact: Contact;
  onDelete: (id: number) => void;
  isLink: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-2 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {isLink ? (
          <a
            href={contact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline truncate max-w-[260px]"
          >
            {contact.value
              .replace("https://www.", "")
              .replace("https://", "")}
          </a>
        ) : (
          <span className="text-sm text-white truncate max-w-[260px]">
            {contact.value}
          </span>
        )}
        <SourceBadge source={contact.source} />
        {contact.score != null && (
          <span className="text-[10px] text-[#6B7280]">{contact.score}</span>
        )}
      </div>
      {contact.source === "manual" && (
        <button
          onClick={() => onDelete(contact.id)}
          className="text-[#6B7280] hover:text-red-400 text-xs shrink-0 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function InputRow({
  placeholder,
  value,
  onChange,
  onAdd,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        placeholder={placeholder}
        className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
      />
      <button
        onClick={onAdd}
        disabled={!value.trim()}
        className="px-4 py-1.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#D4B85A] transition-colors"
      >
        Add
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/prospects");
      const data = (await res.json()) as {
        prospects: Prospect[];
        error?: string;
      };
      if (data.error && !data.prospects?.length) setApiError(data.error);
      setProspects(data.prospects ?? []);
    } catch {
      setApiError(
        "Cannot reach API. Make sure the Next.js server is running (npm run dev)."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = prospects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.ticker.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.ceo_name ?? "").toLowerCase().includes(q)
    );
  });

  function handleSaved(updated: Prospect) {
    setProspects((prev) =>
      prev.map((p) => (p.cik === updated.cik ? updated : p))
    );
    setEditing(null);
  }

  const withEmail = prospects.filter((p) =>
    p.contacts.some((c) => c.channel === "email")
  ).length;
  const withLinkedin = prospects.filter((p) =>
    p.contacts.some((c) => c.channel === "linkedin" && c.source === "manual")
  ).length;
  const avgScore =
    prospects.length
      ? Math.round(
          prospects.reduce((a, p) => a + p.delinquency_score, 0) /
            prospects.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] px-6 py-10">
      <div className="max-w-[1600px] mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              CEO Intelligence
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Micro-cap hot prospects · market cap &lt; $25M · delinquency score
              ≥ 40
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker, company, CEO…"
              className="w-60 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
            <button
              onClick={load}
              className="px-4 py-1.5 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium rounded-lg hover:bg-[#C9A84C] hover:text-black transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Hot Prospects", value: prospects.length },
            { label: "Avg Score", value: avgScore },
            { label: "With Email", value: withEmail },
            { label: "LinkedIn Confirmed", value: withLinkedin },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111111] border border-white/5 rounded-xl p-4"
            >
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-2xl font-semibold text-[#C9A84C] mt-1.5">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#6B7280]">
            <span className="animate-pulse">Loading…</span>
          </div>
        ) : apiError ? (
          <div className="bg-[#1A1A1A] border border-red-900/50 rounded-xl p-8 text-center">
            <p className="text-red-400 font-medium">{apiError}</p>
            <p className="text-[#6B7280] text-sm mt-2">
              Run{" "}
              <code className="text-[#C9A84C]">./run.sh daily --max-cap 25000000</code>{" "}
              to populate the database, then refresh.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-[#6B7280]">
            {search
              ? "No matches. Try a different search."
              : "No hot prospects yet. Run the pipeline to populate."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#111111]">
                  {[
                    "Ticker",
                    "Company",
                    "Mkt Cap",
                    "Score",
                    "Signals",
                    "CEO",
                    "Email",
                    "LinkedIn",
                    "Notes",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((p) => {
                  const email = bestContact(p.contacts, "email");
                  const linkedin = bestContact(p.contacts, "linkedin");
                  return (
                    <tr
                      key={p.cik}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Ticker */}
                      <td className="px-4 py-3 font-mono font-bold text-[#C9A84C] whitespace-nowrap">
                        {p.ticker}
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="text-white block truncate">
                          {p.name}
                        </span>
                        {p.exchange && (
                          <span className="text-[10px] text-[#6B7280]">
                            {p.exchange}
                          </span>
                        )}
                      </td>

                      {/* Market Cap */}
                      <td className="px-4 py-3 text-[#9CA3AF] whitespace-nowrap">
                        {fmtCap(p.market_cap)}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-bold text-base ${ScoreColor(
                            p.delinquency_score
                          )}`}
                        >
                          {p.delinquency_score}
                        </span>
                      </td>

                      {/* Signals */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {p.signal_types ? (
                          <div className="flex flex-wrap gap-1">
                            {p.signal_types.split(",").map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-white/5 text-[#9CA3AF] px-1.5 py-0.5 rounded"
                              >
                                {s.trim().replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#3A3A3A]">—</span>
                        )}
                      </td>

                      {/* CEO */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.ceo_name ? (
                          <div>
                            <span className="text-white">{p.ceo_name}</span>
                            {p.ceo_conf != null && (
                              <span
                                className={`ml-1.5 text-xs ${ConfColor(
                                  p.ceo_conf
                                )}`}
                              >
                                {p.ceo_conf}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#3A3A3A]">Unknown</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {email ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-white truncate">
                              {email.value}
                            </span>
                            <SourceBadge source={email.source} />
                          </div>
                        ) : (
                          <span className="text-[#3A3A3A]">—</span>
                        )}
                      </td>

                      {/* LinkedIn */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {linkedin ? (
                          <a
                            href={linkedin.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {linkedin.source === "manual"
                              ? "✓ Profile"
                              : "Search →"}
                          </a>
                        ) : (
                          <span className="text-[#3A3A3A]">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 max-w-[180px]">
                        {p.notes ? (
                          <span className="text-xs text-[#9CA3AF] truncate block">
                            {p.notes}
                          </span>
                        ) : (
                          <span className="text-[#3A3A3A]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditing(p)}
                          className="px-3 py-1 border border-white/10 text-xs text-[#9CA3AF] rounded-lg hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          prospect={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
