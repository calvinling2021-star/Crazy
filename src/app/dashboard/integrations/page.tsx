"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type Integration = { provider: string; connected: boolean; accountEmail: string | null; updatedAt: string | null };
type EmailMessage = { messageId: string; subject: string; from: string; date: string; attachments: { attachmentId: string; filename: string; mimeType: string; size: number }[] };
type ZoomRecording = { meetingId: string; topic: string; startTime: string; fileId: string; fileType: string; fileSize: number; downloadUrl: string; recordingType: string };

const PROVIDERS = [
  { key: "gmail",    label: "Gmail",         icon: "📧", category: "email",   oauth: true,  setupUrl: "https://console.cloud.google.com/" },
  { key: "outlook",  label: "Outlook",       icon: "📨", category: "email",   oauth: true,  setupUrl: "https://portal.azure.com/" },
  { key: "zoom",     label: "Zoom",          icon: "🎥", category: "video",   oauth: true,  setupUrl: "https://marketplace.zoom.us/" },
  { key: "gdrive",   label: "Google Drive",  icon: "☁️", category: "storage", oauth: false, setupUrl: "https://console.cloud.google.com/" },
  { key: "telegram", label: "Telegram Bot",  icon: "✈️", category: "messaging", oauth: false, setupUrl: "https://t.me/BotFather" },
  { key: "whatsapp", label: "WhatsApp",      icon: "💬", category: "messaging", oauth: false, setupUrl: "https://www.twilio.com/whatsapp" },
  { key: "wechat",   label: "WeChat Work",   icon: "💚", category: "messaging", oauth: false, setupUrl: "https://work.weixin.qq.com/" },
  { key: "wps",      label: "WPS Office",    icon: "📝", category: "office",  oauth: false, setupUrl: "https://www.wps.com/" },
];

const CATEGORIES = [
  { key: "email",     label: "Email" },
  { key: "video",     label: "Video" },
  { key: "storage",   label: "Storage" },
  { key: "messaging", label: "Messaging" },
  { key: "office",    label: "Office" },
];

const CONFIGURE_FIELDS: Record<string, { field: string; label: string; placeholder: string; type?: string }[]> = {
  telegram: [{ field: "botToken", label: "Bot Token", placeholder: "Paste token from @BotFather", type: "password" }],
  whatsapp: [
    { field: "accountSid", label: "Twilio Account SID", placeholder: "AC..." },
    { field: "authToken",  label: "Twilio Auth Token",  placeholder: "••••••••", type: "password" },
    { field: "fromNumber", label: "WhatsApp Number",    placeholder: "+1415..." },
  ],
  wechat: [
    { field: "corpId",     label: "Corp ID",     placeholder: "wx..." },
    { field: "corpSecret", label: "Corp Secret", placeholder: "••••••••", type: "password" },
    { field: "agentId",    label: "Agent ID",    placeholder: "1000001" },
  ],
  wps: [],
};

const SEND_FIELDS: Record<string, { field: string; label: string; placeholder: string }[]> = {
  telegram: [{ field: "chatId",  label: "Chat ID", placeholder: "@username or numeric ID" }],
  whatsapp: [{ field: "to",      label: "Phone Number", placeholder: "+1415..." }],
  wechat:   [{ field: "toUser",  label: "User ID", placeholder: "WeChat Work user ID" }],
};

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isPrincipal = session?.user.role === "PRINCIPAL";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [configModal, setConfigModal] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [configSaving, setConfigSaving] = useState(false);

  const [emailModal, setEmailModal] = useState<"gmail" | "outlook" | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  const [zoomModal, setZoomModal] = useState(false);
  const [recordings, setRecordings] = useState<ZoomRecording[]>([]);
  const [zoomLoading, setZoomLoading] = useState(false);

  const [sendModal, setSendModal] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState<Record<string, string>>({ message: "" });
  const [sending, setSending] = useState(false);

  const [deals, setDeals] = useState<{ id: string; name: string }[]>([]);
  const [importDeal, setImportDeal] = useState("");

  async function load() {
    const [ir, dr] = await Promise.all([fetch("/api/integrations"), fetch("/api/deals")]);
    if (ir.ok) setIntegrations(await ir.json());
    if (dr.ok) setDeals(await dr.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) setNotice({ type: "success", msg: `${connected} connected successfully!` });
    if (error) setNotice({ type: "error", msg: `Connection failed: ${error.replace(/_/g, " ")}` });
  }, [searchParams]);

  const status = Object.fromEntries(integrations.map((i) => [i.provider, i]));

  async function disconnect(provider: string) {
    if (!confirm(`Disconnect ${provider}?`)) return;
    await fetch(`/api/integrations/${provider}/disconnect`, { method: "DELETE" });
    await load();
    setNotice({ type: "success", msg: `${provider} disconnected.` });
  }

  function openConfig(provider: string) {
    setConfigForm({});
    setConfigModal(provider);
  }

  async function saveConfig() {
    if (!configModal) return;
    setConfigSaving(true);
    const res = await fetch(`/api/integrations/${configModal}/configure`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(configForm),
    });
    const data = await res.json();
    setConfigSaving(false);
    if (res.ok) { setConfigModal(null); await load(); setNotice({ type: "success", msg: `${configModal} configured!` }); }
    else setNotice({ type: "error", msg: data.error ?? "Configuration failed" });
  }

  async function loadEmails(provider: "gmail" | "outlook") {
    setEmailModal(provider); setEmailsLoading(true); setEmails([]);
    const res = await fetch(`/api/integrations/${provider}/emails`);
    if (res.ok) setEmails(await res.json());
    setEmailsLoading(false);
  }

  async function importAttachment(provider: string, msg: EmailMessage, att: EmailMessage["attachments"][0]) {
    await fetch(`/api/integrations/${provider}/import`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.messageId, attachmentId: att.attachmentId, filename: att.filename, mimeType: att.mimeType, dealId: importDeal || null }),
    });
    setNotice({ type: "success", msg: `Imported ${att.filename}` });
  }

  async function loadRecordings() {
    setZoomModal(true); setZoomLoading(true); setRecordings([]);
    const res = await fetch("/api/integrations/zoom/recordings");
    if (res.ok) setRecordings(await res.json());
    setZoomLoading(false);
  }

  async function importRecording(rec: ZoomRecording) {
    await fetch("/api/integrations/zoom/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: rec.fileId, downloadUrl: rec.downloadUrl, filename: `${rec.topic}_${rec.fileType}`, fileType: rec.fileType, dealId: importDeal || null }),
    });
    setNotice({ type: "success", msg: `Imported ${rec.topic}` });
  }

  async function sendMessage() {
    if (!sendModal) return;
    setSending(true);
    const res = await fetch(`/api/integrations/${sendModal}/send`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sendForm),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) { setSendModal(null); setSendForm({ message: "" }); setNotice({ type: "success", msg: "Message sent!" }); }
    else setNotice({ type: "error", msg: data.error ?? "Send failed" });
  }

  const WPS_ENV_MISSING = !process.env.NEXT_PUBLIC_HAS_GOOGLE && true;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Connect</p>
        <h1 className="text-white text-2xl font-light">Integrations</h1>
      </div>

      {notice && (
        <div className={clsx("flex items-center gap-3 px-4 py-3 mb-6 border text-sm", notice.type === "success" ? "border-green-800 bg-green-900/20 text-green-400" : "border-red-800 bg-red-900/20 text-red-400")}>
          {notice.type === "success" ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> : <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />}
          {notice.msg}
          <button onClick={() => setNotice(null)} className="ml-auto"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? <p className="text-gray-600 text-sm">Loading...</p> : (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h2 className="text-gray-500 text-xs tracking-widest uppercase mb-3">{cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROVIDERS.filter((p) => p.category === cat.key).map((p) => {
                  const s = status[p.key];
                  const connected = s?.connected;
                  return (
                    <div key={p.key} className="bg-[#111] border border-gray-800 p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{p.label}</p>
                          {connected && s.accountEmail && <p className="text-gray-500 text-xs truncate">{s.accountEmail}</p>}
                        </div>
                        <span className={clsx("text-[10px] tracking-wider uppercase px-2 py-0.5 border rounded-sm", connected ? "text-green-400 border-green-900 bg-green-900/20" : "text-gray-600 border-gray-800")}>
                          {connected ? "On" : "Off"}
                        </span>
                      </div>

                      {p.key === "wps" ? (
                        <div className="text-xs text-gray-500 leading-relaxed">
                          Upload WPS files (.wps, .et, .dps) directly via the Documents page. WPS Office formats are fully supported.
                          <a href="https://www.wps.com/office-free-download-desktop/" target="_blank" rel="noreferrer" className="text-[#c9a84c] ml-1 hover:underline">Get WPS Office ↗</a>
                        </div>
                      ) : p.key === "gdrive" ? (
                        <div className="text-xs text-gray-500 leading-relaxed">
                          Connect Gmail first, then set <code className="text-gray-400">GOOGLE_DRIVE_STORAGE=true</code> in your .env. All uploaded files will be stored in your Google Drive instead of locally.
                          {connected && <span className="text-green-400 block mt-1">✓ Drive scope active via Gmail connection</span>}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {!connected && isPrincipal && (
                            p.oauth ? (
                              <a href={`/api/integrations/${p.key}/connect`} className="text-xs tracking-wider uppercase px-3 py-1.5 bg-[#c9a84c] text-black hover:bg-[#b8972e] transition-colors">
                                Connect
                              </a>
                            ) : (
                              <button onClick={() => openConfig(p.key)} className="text-xs tracking-wider uppercase px-3 py-1.5 bg-[#c9a84c] text-black hover:bg-[#b8972e] transition-colors">
                                Configure
                              </button>
                            )
                          )}
                          {connected && (
                            <>
                              {p.key === "gmail" && <button onClick={() => loadEmails("gmail")} className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white transition-colors">Import emails</button>}
                              {p.key === "outlook" && <button onClick={() => loadEmails("outlook")} className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white transition-colors">Import emails</button>}
                              {p.key === "zoom" && <button onClick={loadRecordings} className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white transition-colors">Import recordings</button>}
                              {["telegram","whatsapp","wechat"].includes(p.key) && (
                                <button onClick={() => { setSendModal(p.key); setSendForm({ message: "" }); }} className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white transition-colors">Send message</button>
                              )}
                              {isPrincipal && (
                                <button onClick={() => disconnect(p.key)} className="text-xs px-3 py-1.5 border border-gray-800 text-red-500/60 hover:text-red-400 transition-colors">Disconnect</button>
                              )}
                            </>
                          )}
                          {!connected && !isPrincipal && (
                            <p className="text-gray-600 text-xs">Not connected — contact admin</p>
                          )}
                        </div>
                      )}

                      {!connected && isPrincipal && p.key !== "wps" && (
                        <p className="text-gray-700 text-xs">
                          {p.oauth ? "Requires app credentials in " : "Requires account at "}
                          <a href={p.setupUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-300 underline">
                            {new URL(p.setupUrl).hostname}
                          </a>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure modal (Telegram / WhatsApp / WeChat) */}
      {configModal && (
        <Modal title={`Configure ${PROVIDERS.find((p) => p.key === configModal)?.label}`} onClose={() => setConfigModal(null)}>
          <div className="space-y-4">
            {(CONFIGURE_FIELDS[configModal] ?? []).map((f) => (
              <div key={f.field}>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">{f.label}</label>
                <input type={f.type ?? "text"} value={configForm[f.field] ?? ""} onChange={(e) => setConfigForm({ ...configForm, [f.field]: e.target.value })} placeholder={f.placeholder}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]" />
              </div>
            ))}
            <p className="text-gray-600 text-xs">
              {configModal === "telegram" && "Create a bot via @BotFather on Telegram, then paste the token above."}
              {configModal === "whatsapp" && "Get your Twilio SID and Auth Token from console.twilio.com. Use the WhatsApp sandbox number for testing."}
              {configModal === "wechat" && "Create a WeChat Work app at work.weixin.qq.com. Find Corp ID in Settings → Enterprise Info."}
            </p>
          </div>
          <ModalActions onCancel={() => setConfigModal(null)} onSave={saveConfig} saving={configSaving} />
        </Modal>
      )}

      {/* Email import modal */}
      {emailModal && (
        <Modal title={`Import from ${emailModal === "gmail" ? "Gmail" : "Outlook"}`} onClose={() => setEmailModal(null)} wide>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Attach imports to deal (optional)</label>
            <select value={importDeal} onChange={(e) => setImportDeal(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2 text-sm focus:outline-none focus:border-[#c9a84c]">
              <option value="">— No deal —</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {emailsLoading ? <p className="text-gray-600 text-sm py-4">Loading emails...</p> : emails.length === 0 ? <p className="text-gray-600 text-sm py-4">No emails with attachments found.</p> : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emails.map((msg) => (
                <div key={msg.messageId} className="bg-[#0a0a0a] border border-gray-800 p-4">
                  <p className="text-white text-sm font-medium truncate">{msg.subject || "(no subject)"}</p>
                  <p className="text-gray-500 text-xs mb-3">{msg.from} · {new Date(msg.date).toLocaleDateString()}</p>
                  <div className="space-y-1.5">
                    {msg.attachments.map((att) => (
                      <div key={att.attachmentId} className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs flex-1 truncate">{att.filename}</span>
                        <button onClick={() => importAttachment(emailModal, msg, att)} className="text-xs text-[#c9a84c] hover:underline flex-shrink-0">Import</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={() => setEmailModal(null)} className="border border-gray-700 text-gray-400 text-xs tracking-widest uppercase px-6 py-2.5 hover:text-white transition-colors">Close</button>
          </div>
        </Modal>
      )}

      {/* Zoom recordings modal */}
      {zoomModal && (
        <Modal title="Import from Zoom" onClose={() => setZoomModal(false)} wide>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Attach imports to deal (optional)</label>
            <select value={importDeal} onChange={(e) => setImportDeal(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2 text-sm focus:outline-none focus:border-[#c9a84c]">
              <option value="">— No deal —</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {zoomLoading ? <p className="text-gray-600 text-sm py-4">Loading recordings...</p> : recordings.length === 0 ? <p className="text-gray-600 text-sm py-4">No recordings found in the last 30 days.</p> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recordings.map((rec) => (
                <div key={rec.fileId} className="bg-[#0a0a0a] border border-gray-800 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{rec.topic}</p>
                    <p className="text-gray-500 text-xs">{new Date(rec.startTime).toLocaleDateString()} · {rec.fileType} · {(rec.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => importRecording(rec)} className="text-xs text-[#c9a84c] hover:underline flex-shrink-0">Import</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={() => setZoomModal(false)} className="border border-gray-700 text-gray-400 text-xs tracking-widest uppercase px-6 py-2.5 hover:text-white transition-colors">Close</button>
          </div>
        </Modal>
      )}

      {/* Send message modal */}
      {sendModal && (
        <Modal title={`Send via ${PROVIDERS.find((p) => p.key === sendModal)?.label}`} onClose={() => setSendModal(null)}>
          <div className="space-y-4">
            {(SEND_FIELDS[sendModal] ?? []).map((f) => (
              <div key={f.field}>
                <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">{f.label}</label>
                <input type="text" value={sendForm[f.field] ?? ""} onChange={(e) => setSendForm({ ...sendForm, [f.field]: e.target.value })} placeholder={f.placeholder}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 tracking-widest uppercase mb-2">Message</label>
              <textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} rows={4}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none" />
            </div>
          </div>
          <ModalActions onCancel={() => setSendModal(null)} onSave={sendMessage} saving={sending} saveLabel="Send" />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={clsx("bg-[#111] border border-gray-700 flex flex-col max-h-[90vh] w-full", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-white text-lg font-light">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saving, saveLabel = "Save" }: { onCancel: () => void; onSave: () => void; saving: boolean; saveLabel?: string }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onCancel} className="flex-1 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase py-2.5 hover:text-white transition-colors">Cancel</button>
      <button onClick={onSave} disabled={saving} className="flex-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase py-2.5 hover:bg-[#b8972e] transition-colors disabled:opacity-50">
        {saving ? "..." : saveLabel}
      </button>
    </div>
  );
}
