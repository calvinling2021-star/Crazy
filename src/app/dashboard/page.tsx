"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Contact {
  id: number;
  ceo_id: number;
  channel: "email" | "linkedin";
  value: string;
  source: string;
  score: number | null;
}

interface Activity {
  id: number;
  ceo_id: number;
  type: string;
  body: string | null;
  created_at: string;
  created_by: string | null;
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
  outreach_stage: string;
  last_contacted_at: string | null;
  assigned_to: string | null;
  follow_up_at: string | null;
  contacts: Contact[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: Record<string, { label: string; cls: string }> = {
  new:            { label: "New",            cls: "bg-white/5 text-gray-400" },
  emailed:        { label: "Emailed",        cls: "bg-blue-900/50 text-blue-300" },
  replied:        { label: "Replied",        cls: "bg-purple-900/50 text-purple-300" },
  call_scheduled: { label: "Call Sched.",    cls: "bg-amber-900/50 text-amber-300" },
  call_done:      { label: "Call Done",      cls: "bg-orange-900/50 text-orange-300" },
  proposal_sent:  { label: "Proposal Sent",  cls: "bg-indigo-900/50 text-indigo-300" },
  term_sent:      { label: "Term Sent",      cls: "bg-teal-900/50 text-teal-300" },
  closed:         { label: "Closed ✓",      cls: "bg-green-900/50 text-green-300" },
  passed:         { label: "Passed",         cls: "bg-red-900/30 text-red-500" },
};

const ACTIVITY_TYPES: Record<string, { label: string; icon: string; nextStage?: string }> = {
  email_sent:     { label: "Email Sent",      icon: "✉️", nextStage: "emailed" },
  linkedin_msg:   { label: "LinkedIn Msg",    icon: "🔗", nextStage: "emailed" },
  call_scheduled: { label: "Call Scheduled",  icon: "📅", nextStage: "call_scheduled" },
  call_done:      { label: "Call Done",       icon: "📞", nextStage: "call_done" },
  proposal_sent:  { label: "Proposal Sent",   icon: "📄", nextStage: "proposal_sent" },
  term_sent:      { label: "Term Sheet Sent", icon: "📝", nextStage: "term_sent" },
  note:           { label: "Note",            icon: "💬", nextStage: undefined },
};

const SIGNAL_TIPS: Record<string, string> = {
  "NT-10K":               "Late annual report — common sign of financial distress",
  "NT-10-K":              "Late annual report — common sign of financial distress",
  "NT-10Q":               "Late quarterly report",
  "NT-10-Q":              "Late quarterly report",
  deficiency:             "Exchange deficiency notice — at risk of delisting",
  going_concern:          "Auditor issued going concern warning in 10-K",
  auditor_change:         "Changed auditors in last 12 months",
  strategic_alternatives: "8-K: strategic alternatives review — M&A likely",
  reverse_split:          "Announced reverse stock split — often to avoid delisting",
};

const CONTACTED_STAGES = new Set([
  "emailed", "replied", "call_scheduled", "call_done", "proposal_sent", "term_sent", "closed",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCap(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function isOverdue(follow_up_at: string | null): boolean {
  if (!follow_up_at) return false;
  return follow_up_at < new Date().toISOString().slice(0, 10);
}

function bestContact(contacts: Contact[], channel: "email" | "linkedin"): Contact | null {
  const ch = contacts.filter((c) => c.channel === channel);
  if (!ch.length) return null;
  return ch.sort((a, b) => {
    const r = (s: string) => (s === "manual" ? 3 : s === "hunter" ? 2 : 1);
    return r(b.source) - r(a.source) || (b.score ?? 0) - (a.score ?? 0);
  })[0];
}

function readiness(p: Prospect): number {
  let score = 0;
  const emails = p.contacts.filter((c) => c.channel === "email");
  const lins = p.contacts.filter((c) => c.channel === "linkedin");
  if (emails.some((e) => e.source === "manual" || e.source === "hunter")) score += 2;
  else if (emails.some((e) => e.source?.includes("valid"))) score += 2;
  else if (emails.length > 0) score += 1;
  if (lins.some((l) => l.source === "manual")) score += 1;
  if ((p.ceo_conf ?? 0) >= 70) score += 1;
  if (p.delinquency_score >= 60) score += 1;
  return score; // 0-5
}

function gmailUrl(p: Prospect, emailAddr: string): string {
  const firstName = (p.ceo_name ?? "").split(" ")[0];
  const sigs = (p.signal_types ?? "").split(",").map((s) => s.trim());
  let opener = `We follow micro-cap public companies navigating financial transitions and came across ${p.name}.`;
  if (sigs.includes("strategic_alternatives"))
    opener = `We saw ${p.name}'s strategic alternatives announcement and wanted to reach out directly.`;
  else if (sigs.some((s) => s.startsWith("NT-")))
    opener = `We noticed ${p.ticker}'s recent filing extension and thought we might be able to help.`;
  else if (sigs.includes("going_concern"))
    opener = `We noted the going concern disclosure in ${p.ticker}'s most recent 10-K.`;
  else if (sigs.includes("deficiency"))
    opener = `We saw ${p.ticker}'s exchange deficiency notice and thought we might be able to help.`;

  const subject = `Molecule Capital — ${p.ticker}`;
  const body = [
    `Hi ${firstName},`,
    "",
    opener,
    "",
    "We are Molecule Capital, a family office focused on healthcare and biotech. We work with management teams on bridge capital, recapitalizations, and strategic transactions.",
    "",
    "Would you be open to a 20-minute call to explore if there's a fit?",
    "",
    "Best,",
    "[Your Name]",
    "Molecule Capital",
  ].join("\n");

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function calendarUrl(p: Prospect, emailAddr: string): string {
  const title = `Intro Call — ${p.ceo_name ?? p.ticker} / Molecule Capital`;
  const details = [
    `Company: ${p.name} (${p.ticker})`,
    `Market Cap: ${fmtCap(p.market_cap)}`,
    `Delinquency Score: ${p.delinquency_score}`,
    `Signals: ${(p.signal_types ?? "N/A").replace(/,/g, ", ")}`,
    "",
    "Zoom: [ADD LINK]",
  ].join("\n");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&add=${encodeURIComponent(emailAddr)}`;
}

async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
}

// ── Small UI pieces ───────────────────────────────────────────────────────────

function ReadinessDots({ score }: { score: number }) {
  const color = score >= 4 ? "bg-green-500" : score >= 2 ? "bg-amber-500" : "bg-red-700";
  const tip = score >= 4 ? "Ready to reach out" : score >= 2 ? "Needs minor enrichment" : "Needs research";
  return (
    <span title={tip} className="flex gap-0.5 items-center cursor-help">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= score ? color : "bg-white/10"}`}
        />
      ))}
    </span>
  );
}

function StagePill({ stage }: { stage: string }) {
  const cfg = STAGES[stage] ?? STAGES.new;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const cls =
    source === "manual"
      ? "bg-green-900/60 text-green-300"
      : source === "hunter"
      ? "bg-blue-900/60 text-blue-300"
      : source === "rocketreach"
      ? "bg-purple-900/60 text-purple-300"
      : "bg-white/5 text-gray-500";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {source.replace("pattern:", "")}
    </span>
  );
}

function SignalTag({ sig }: { sig: string }) {
  const tip = SIGNAL_TIPS[sig.trim()] ?? sig;
  return (
    <span
      title={tip}
      className="text-[10px] bg-white/5 text-[#9CA3AF] px-1.5 py-0.5 rounded cursor-help hover:bg-white/10 transition-colors"
    >
      {sig.trim().replace(/_/g, " ")}
    </span>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handle() {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={handle}
      title={`Copy ${label}`}
      className="text-[10px] text-[#6B7280] hover:text-[#C9A84C] transition-colors shrink-0"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

// ── Stage select (inline in table row) ───────────────────────────────────────

function StageSelect({
  ceoId,
  current,
  onChange,
}: {
  ceoId: number;
  current: string;
  onChange: (stage: string) => void;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stage = e.target.value;
    onChange(stage);
    await fetch(`/api/ceo/${ceoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreach_stage: stage }),
    });
  }
  const cfg = STAGES[current] ?? STAGES.new;
  return (
    <select
      value={current}
      onChange={handleChange}
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none ${cfg.cls} bg-transparent appearance-none`}
      style={{ WebkitAppearance: "none" }}
    >
      {Object.entries(STAGES).map(([k, v]) => (
        <option key={k} value={k} className="bg-[#1A1A1A] text-white text-xs">
          {v.label}
        </option>
      ))}
    </select>
  );
}

// ── Edit / Outreach Modal ─────────────────────────────────────────────────────

function EditModal({
  prospect,
  onClose,
  onUpdated,
}: {
  prospect: Prospect;
  onClose: () => void;
  onUpdated: (p: Prospect) => void;
}) {
  const [p, setP] = useState<Prospect>(prospect);
  const [emailInput, setEmailInput] = useState("");
  const [linkedinInput, setLinkedinInput] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actType, setActType] = useState<keyof typeof ACTIVITY_TYPES>("email_sent");
  const [actBody, setActBody] = useState("");
  const [actBy, setActBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const bestEmail = bestContact(p.contacts, "email");
  const emails = p.contacts.filter((c) => c.channel === "email");
  const linkedins = p.contacts.filter((c) => c.channel === "linkedin");

  useEffect(() => {
    if (!p.ceo_id) return;
    fetch(`/api/ceo/${p.ceo_id}/activities`)
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []));
  }, [p.ceo_id]);

  // Persist any field change
  async function patchCeo(fields: Partial<Prospect>) {
    if (!p.ceo_id) return;
    const next = { ...p, ...fields };
    setP(next);
    onUpdated(next);
    await fetch(`/api/ceo/${p.ceo_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  }

  async function addContact(channel: "email" | "linkedin", value: string) {
    const v = value.trim();
    if (!v || !p.ceo_id) return;
    setErr("");
    const res = await fetch(`/api/ceo/${p.ceo_id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, value: v }),
    });
    if (!res.ok) { setErr("Failed to save contact."); return; }
    const c: Contact = await res.json();
    const updated = { ...p, contacts: [...p.contacts.filter((x) => !(x.channel === channel && x.value === v)), c] };
    setP(updated);
    onUpdated(updated);
    if (channel === "email") setEmailInput("");
    else setLinkedinInput("");
  }

  async function removeContact(id: number) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    const updated = { ...p, contacts: p.contacts.filter((c) => c.id !== id) };
    setP(updated);
    onUpdated(updated);
  }

  async function logActivity(openUrl?: string) {
    if (!p.ceo_id) return;
    setSaving(true);
    setErr("");
    try {
      const meta = ACTIVITY_TYPES[actType];
      const res = await fetch(`/api/ceo/${p.ceo_id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: actType, body: actBody || null, created_by: actBy || null }),
      });
      const act: Activity = await res.json();
      setActivities((prev) => [act, ...prev]);
      setActBody("");

      if (meta.nextStage) {
        await patchCeo({ outreach_stage: meta.nextStage } as Partial<Prospect>);
      }
      if (openUrl) window.open(openUrl, "_blank", "noopener");
    } catch {
      setErr("Failed to log activity.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    setErr("");
    try {
      await patchCeo({ notes: p.notes ?? "" } as Partial<Prospect>);
    } catch {
      setErr("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{p.ceo_name ?? "Unknown CEO"}</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {p.ticker} · {p.name} · {fmtCap(p.market_cap)}
            </p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-white text-2xl leading-none">×</button>
        </div>

        {err && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded px-3 py-2">{err}</p>
        )}

        {/* ── Outreach CRM ── */}
        <ModalSection label="Outreach">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6B7280] uppercase tracking-widest block mb-1">Stage</label>
              <select
                value={p.outreach_stage}
                onChange={(e) => patchCeo({ outreach_stage: e.target.value } as Partial<Prospect>)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
              >
                {Object.entries(STAGES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] uppercase tracking-widest block mb-1">Follow-up Date</label>
              <input
                type="date"
                value={p.follow_up_at ?? ""}
                onChange={(e) => patchCeo({ follow_up_at: e.target.value || null } as Partial<Prospect>)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="text-[10px] text-[#6B7280] uppercase tracking-widest block mb-1">Assigned To</label>
            <input
              type="text"
              value={p.assigned_to ?? ""}
              onChange={(e) => patchCeo({ assigned_to: e.target.value || null } as Partial<Prospect>)}
              placeholder="Team member name"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          {/* Gmail + Zoom buttons */}
          {bestEmail && (
            <div className="flex gap-2 mt-3">
              <a
                href={gmailUrl(p, bestEmail.value)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                <span>✉️</span> Draft Gmail
              </a>
              <a
                href={calendarUrl(p, bestEmail.value)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                <span>📅</span> Schedule Zoom
              </a>
            </div>
          )}
        </ModalSection>

        {/* ── Emails ── */}
        <ModalSection label="Email Addresses">
          <div className="space-y-1.5 mb-3">
            {emails.length === 0 && <p className="text-xs text-[#6B7280]">No emails saved yet.</p>}
            {emails.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-white truncate">{c.value}</span>
                  <SourceBadge source={c.source} />
                  {c.score != null && <span className="text-[10px] text-[#6B7280]">{c.score}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={c.value} label="email" />
                  {c.source === "manual" && (
                    <button onClick={() => removeContact(c.id)} className="text-[10px] text-[#6B7280] hover:text-red-400 transition-colors">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addContact("email", emailInput)}
              placeholder="name@company.com"
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
            <button
              onClick={() => addContact("email", emailInput)}
              disabled={!emailInput.trim()}
              className="px-4 py-1.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#D4B85A] transition-colors"
            >
              Add
            </button>
          </div>
        </ModalSection>

        {/* ── LinkedIn ── */}
        <ModalSection label="LinkedIn Profiles">
          <div className="space-y-1.5 mb-3">
            {linkedins.length === 0 && <p className="text-xs text-[#6B7280]">No profiles saved yet.</p>}
            {linkedins.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <a
                    href={c.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline truncate max-w-[250px]"
                  >
                    {c.value.replace("https://www.", "").replace("https://", "")}
                  </a>
                  <SourceBadge source={c.source} />
                  {c.score != null && <span className="text-[10px] text-[#6B7280]">{c.score}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={c.value} label="URL" />
                  {c.source === "manual" && (
                    <button onClick={() => removeContact(c.id)} className="text-[10px] text-[#6B7280] hover:text-red-400 transition-colors">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={linkedinInput}
              onChange={(e) => setLinkedinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addContact("linkedin", linkedinInput)}
              placeholder="https://linkedin.com/in/…"
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
            <button
              onClick={() => addContact("linkedin", linkedinInput)}
              disabled={!linkedinInput.trim()}
              className="px-4 py-1.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#D4B85A] transition-colors"
            >
              Add
            </button>
          </div>
        </ModalSection>

        {/* ── Notes ── */}
        <ModalSection label="Notes">
          <textarea
            value={p.notes ?? ""}
            onChange={(e) => setP((prev) => ({ ...prev, notes: e.target.value }))}
            onBlur={saveNotes}
            rows={3}
            placeholder="Enter notes about this CEO or opportunity…"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C] resize-none"
          />
          <p className="text-[10px] text-[#6B7280] mt-1">Auto-saves on blur.</p>
        </ModalSection>

        {/* ── Log Activity ── */}
        <ModalSection label="Log Activity">
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value as keyof typeof ACTIVITY_TYPES)}
                className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
              >
                {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={actBy}
                onChange={(e) => setActBy(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <input
              type="text"
              value={actBody}
              onChange={(e) => setActBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && logActivity()}
              placeholder="Optional details (subject line, call summary…)"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => logActivity()}
                disabled={saving}
                className="flex-1 py-1.5 bg-[#1A1A1A] border border-[#C9A84C] text-[#C9A84C] text-sm rounded-lg hover:bg-[#C9A84C] hover:text-black transition-colors disabled:opacity-50"
              >
                {saving ? "Logging…" : "Log"}
              </button>
              {(actType === "email_sent") && bestEmail && (
                <button
                  onClick={() => logActivity(gmailUrl(p, bestEmail.value))}
                  disabled={saving}
                  className="flex-1 py-1.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#D4B85A] transition-colors disabled:opacity-50"
                >
                  Log + Open Gmail
                </button>
              )}
              {actType === "call_scheduled" && bestEmail && (
                <button
                  onClick={() => logActivity(calendarUrl(p, bestEmail.value))}
                  disabled={saving}
                  className="flex-1 py-1.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#D4B85A] transition-colors disabled:opacity-50"
                >
                  Log + Open Calendar
                </button>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          {activities.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
              {activities.map((a) => {
                const meta = ACTIVITY_TYPES[a.type];
                return (
                  <div key={a.id} className="flex gap-2 text-xs bg-[#1A1A1A] rounded-lg px-3 py-2">
                    <span className="shrink-0">{meta?.icon ?? "•"}</span>
                    <div className="min-w-0">
                      <span className="text-[#9CA3AF] font-medium">{meta?.label ?? a.type}</span>
                      {a.body && <span className="text-[#6B7280] ml-1">— {a.body}</span>}
                      <div className="text-[#3A3A3A] mt-0.5">
                        {fmtDate(a.created_at)} {a.created_by && `· ${a.created_by}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ModalSection>

        <div className="flex justify-end pt-1">
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

function ModalSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">{label}</p>
      {children}
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
  const [stageFilter, setStageFilter] = useState("all");
  const copiedRef = useRef<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/prospects");
      const data = (await res.json()) as { prospects: Prospect[]; error?: string };
      if (data.error && !data.prospects?.length) setApiError(data.error);
      setProspects(data.prospects ?? []);
    } catch {
      setApiError("Cannot reach API. Start the server with: npm run dev");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateProspect(updated: Prospect) {
    setProspects((prev) => prev.map((p) => (p.cik === updated.cik ? updated : p)));
  }

  function updateStageInline(cik: string, stage: string) {
    setProspects((prev) =>
      prev.map((p) => p.cik === cik ? { ...p, outreach_stage: stage } : p)
    );
  }

  async function handleCopy(id: string, text: string) {
    await copyToClipboard(text);
    setCopiedId(id);
    copiedRef.current = id;
    setTimeout(() => {
      if (copiedRef.current === id) setCopiedId(null);
    }, 1800);
  }

  const filtered = prospects.filter((p) => {
    if (stageFilter !== "all" && p.outreach_stage !== stageFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.ticker.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.ceo_name ?? "").toLowerCase().includes(q) ||
      (p.assigned_to ?? "").toLowerCase().includes(q)
    );
  });

  const contacted = prospects.filter((p) => CONTACTED_STAGES.has(p.outreach_stage)).length;
  const ready = prospects.filter((p) => readiness(p) >= 4).length;
  const overdue = prospects.filter((p) => isOverdue(p.follow_up_at)).length;
  const avgScore = prospects.length
    ? Math.round(prospects.reduce((a, p) => a + p.delinquency_score, 0) / prospects.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] px-6 py-10">
      <div className="max-w-[1700px] mx-auto">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">CEO Intelligence</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Micro-cap hot prospects · market cap &lt; $25M · delinquency score ≥ 40
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker, company, CEO, assignee…"
              className="w-64 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#C9A84C]"
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <a
              href="/api/export/csv"
              className="px-4 py-1.5 bg-[#1A1A1A] border border-white/10 text-[#9CA3AF] text-sm rounded-lg hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              ↓ CSV
            </a>
            <button
              onClick={load}
              className="px-4 py-1.5 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium rounded-lg hover:bg-[#C9A84C] hover:text-black transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Hot Prospects", value: prospects.length, highlight: false },
            { label: "Contacted", value: contacted, highlight: false },
            { label: "Ready to Send", value: ready, highlight: false },
            { label: "Avg Score", value: avgScore, highlight: false },
            { label: "Overdue Follow-ups", value: overdue, highlight: overdue > 0 },
          ].map((s) => (
            <div key={s.label} className="bg-[#111111] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1.5 ${s.highlight ? "text-red-400" : "text-[#C9A84C]"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
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
            {search || stageFilter !== "all"
              ? "No matches. Try adjusting your filters."
              : "No hot prospects yet. Run the pipeline to populate."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#111111]">
                  {[
                    "·",
                    "Ticker",
                    "Company",
                    "Mkt Cap",
                    "Score",
                    "Signals",
                    "CEO",
                    "Email",
                    "LinkedIn",
                    "Stage",
                    "Follow-up",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest whitespace-nowrap"
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
                  const rScore = readiness(p);
                  const overdueFu = isOverdue(p.follow_up_at);
                  const emailCopyId = `email-${p.cik}`;

                  return (
                    <tr key={p.cik} className="hover:bg-white/[0.02] transition-colors">
                      {/* Readiness */}
                      <td className="px-3 py-3">
                        <ReadinessDots score={rScore} />
                      </td>

                      {/* Ticker */}
                      <td className="px-3 py-3 font-mono font-bold text-[#C9A84C] whitespace-nowrap">
                        {p.ticker}
                      </td>

                      {/* Company */}
                      <td className="px-3 py-3 max-w-[160px]">
                        <span className="text-white block truncate" title={p.name}>{p.name}</span>
                        {p.exchange && <span className="text-[10px] text-[#6B7280]">{p.exchange}</span>}
                      </td>

                      {/* Market Cap */}
                      <td className="px-3 py-3 text-[#9CA3AF] whitespace-nowrap">{fmtCap(p.market_cap)}</td>

                      {/* Score */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`font-bold text-base ${p.delinquency_score >= 80 ? "text-red-400" : p.delinquency_score >= 60 ? "text-orange-400" : "text-yellow-400"}`}>
                          {p.delinquency_score}
                        </span>
                      </td>

                      {/* Signals */}
                      <td className="px-3 py-3 max-w-[180px]">
                        {p.signal_types ? (
                          <div className="flex flex-wrap gap-1">
                            {p.signal_types.split(",").map((s) => <SignalTag key={s} sig={s} />)}
                          </div>
                        ) : <span className="text-[#3A3A3A]">—</span>}
                      </td>

                      {/* CEO */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.ceo_name ? (
                          <div>
                            <span className="text-white">{p.ceo_name}</span>
                            {p.ceo_conf != null && (
                              <span className={`ml-1.5 text-[10px] ${p.ceo_conf >= 70 ? "text-green-400" : p.ceo_conf >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                                {p.ceo_conf}%
                              </span>
                            )}
                          </div>
                        ) : <span className="text-[#3A3A3A]">Unknown</span>}
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 max-w-[190px]">
                        {email ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-white truncate" title={email.value}>{email.value}</span>
                            <SourceBadge source={email.source} />
                            <button
                              onClick={() => handleCopy(emailCopyId, email.value)}
                              title="Copy email"
                              className="text-[10px] text-[#6B7280] hover:text-[#C9A84C] transition-colors shrink-0"
                            >
                              {copiedId === emailCopyId ? "✓" : "⎘"}
                            </button>
                          </div>
                        ) : <span className="text-[#3A3A3A]">—</span>}
                      </td>

                      {/* LinkedIn */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {linkedin ? (
                          linkedin.source === "manual" ? (
                            <a href={linkedin.value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                              ✓ Profile
                            </a>
                          ) : (
                            <a href={linkedin.value} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B7280] hover:text-blue-400 hover:underline" title="Google search (not a confirmed profile)">
                              Google →
                            </a>
                          )
                        ) : <span className="text-[#3A3A3A]">—</span>}
                      </td>

                      {/* Stage (inline selector) */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.ceo_id ? (
                          <StageSelect
                            ceoId={p.ceo_id}
                            current={p.outreach_stage}
                            onChange={(stage) => updateStageInline(p.cik, stage)}
                          />
                        ) : <StagePill stage={p.outreach_stage} />}
                      </td>

                      {/* Follow-up */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.follow_up_at ? (
                          <span className={`text-xs ${overdueFu ? "text-red-400 font-semibold" : "text-[#9CA3AF]"}`}>
                            {overdueFu && "⚠ "}{fmtDate(p.follow_up_at)}
                          </span>
                        ) : <span className="text-[#3A3A3A]">—</span>}
                      </td>

                      {/* Edit */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setEditing(p)}
                          className="px-3 py-1 border border-white/10 text-xs text-[#9CA3AF] rounded-lg hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
                        >
                          Outreach
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
          onUpdated={(updated) => {
            updateProspect(updated);
            setEditing(updated);
          }}
        />
      )}
    </div>
  );
}
