"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { niches } from "@/data/niches";
import { MusicNiche, GenerationJob, PromptTemplate } from "@/lib/types";
import { NICHE_LABELS } from "@/lib/constants";
import clsx from "clsx";

const NICHE_COLORS: Record<MusicNiche, string> = {
  sleep: "#3B82F6",
  meditation: "#8B5CF6",
  focus: "#F59E0B",
  lofi: "#14B8A6",
  ambient: "#10B981",
  nature: "#22C55E",
};

function formatDuration(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 60)}m`;
}

function StatusBadge({ status }: { status: GenerationJob["status"] }) {
  const styles: Record<GenerationJob["status"], string> = {
    queued: "text-molecule-muted bg-molecule-gray/30 border-molecule-gray/30",
    generating: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    distributing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    failed: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  const labels: Record<GenerationJob["status"], string> = {
    queued: "Queued",
    generating: "Generating…",
    distributing: "Distributing",
    completed: "Live",
    failed: "Failed",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1.5 bg-molecule-gray/30 rounded-full overflow-hidden">
      <div
        className="h-full bg-molecule-gold rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function StudioContent() {
  const searchParams = useSearchParams();
  const initialNiche = (searchParams.get("niche") as MusicNiche) || "sleep";

  const [selectedNiche, setSelectedNiche] = useState<MusicNiche>(initialNiche);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [queue, setQueue] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const currentNiche = niches.find((n) => n.id === selectedNiche)!;
  const prompt = customPrompt.trim() || selectedTemplate?.prompt || "";

  const selectTemplate = useCallback((tpl: PromptTemplate) => {
    setSelectedTemplate(tpl);
    setCustomPrompt(tpl.prompt);
  }, []);

  const generateTrack = useCallback(async () => {
    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    const jobId = `job_${Date.now()}`;

    const job: GenerationJob = {
      id: jobId,
      prompt,
      niche: selectedNiche,
      title: "",
      status: "generating",
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    // Optimistic add
    setQueue((prev) => [job, ...prev]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, niche: selectedNiche }),
      });
      const data = await res.json();

      // Update job with generated title
      setQueue((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, title: data.title, status: "generating" } : j
        )
      );

      // Simulate progress
      const stages = [
        { pct: 15, delay: 800, status: "generating" as const },
        { pct: 35, delay: 1600 },
        { pct: 60, delay: 2800 },
        { pct: 80, delay: 4200 },
        { pct: 95, delay: 5800 },
        { pct: 100, delay: 7200, status: "distributing" as const },
      ];

      for (const stage of stages) {
        await new Promise((r) => setTimeout(r, stage.delay));
        setQueue((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, progress: stage.pct, status: (stage.status as GenerationJob["status"]) ?? j.status }
              : j
          )
        );
      }

      // Final complete
      await new Promise((r) => setTimeout(r, 3000));
      setQueue((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "completed", progress: 100 } : j
        )
      );
    } catch {
      setQueue((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "failed" } : j))
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedNiche, isGenerating]);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-molecule-white">AI Track Studio</h1>
        <p className="text-molecule-muted text-sm mt-1">
          Generate professional AI music tracks and distribute to 150+ platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Niche + Prompt builder */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Niche selector */}
          <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
            <h2 className="text-sm font-semibold text-molecule-white mb-4">1. Choose Your Niche</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {niches.map((niche) => (
                <button
                  key={niche.id}
                  onClick={() => {
                    setSelectedNiche(niche.id);
                    setSelectedTemplate(null);
                    setCustomPrompt("");
                  }}
                  className={clsx(
                    "flex flex-col p-4 border text-left transition-all duration-200",
                    selectedNiche === niche.id
                      ? "border-opacity-60"
                      : "border-molecule-gray/20 hover:border-molecule-gray/40"
                  )}
                  style={
                    selectedNiche === niche.id
                      ? {
                          borderColor: niche.color + "60",
                          backgroundColor: niche.color + "08",
                        }
                      : {}
                  }
                >
                  <span className="text-xl mb-2">{niche.icon}</span>
                  <span className="text-sm font-semibold text-molecule-white block">{niche.label}</span>
                  <span
                    className="text-[10px] font-semibold mt-1 block"
                    style={{ color: niche.color }}
                  >
                    {niche.avgMonthlyRevenue} / mo
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt template selector */}
          <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
            <h2 className="text-sm font-semibold text-molecule-white mb-4">
              2. Pick a Template or Write Your Own
            </h2>
            <div className="grid grid-cols-1 gap-2 mb-5">
              {currentNiche.promptTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => selectTemplate(tpl)}
                  className={clsx(
                    "text-left p-4 border transition-all duration-200",
                    selectedTemplate?.id === tpl.id
                      ? "border-molecule-gold/40 bg-molecule-gold/5"
                      : "border-molecule-gray/20 hover:border-molecule-gray/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 transition-colors",
                        selectedTemplate?.id === tpl.id
                          ? "bg-molecule-gold border-molecule-gold"
                          : "border-molecule-gray"
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-molecule-white mb-1">{tpl.label}</p>
                      <p className="text-xs text-molecule-muted leading-relaxed line-clamp-2">
                        {tpl.prompt}
                      </p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full border"
                            style={{
                              color: NICHE_COLORS[selectedNiche],
                              borderColor: NICHE_COLORS[selectedNiche] + "30",
                              backgroundColor: NICHE_COLORS[selectedNiche] + "10",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom prompt textarea */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted block mb-2">
                Custom Prompt (edit or write from scratch)
              </label>
              <textarea
                ref={promptRef}
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  setSelectedTemplate(null);
                }}
                rows={4}
                placeholder={`Describe your ${NICHE_LABELS[selectedNiche].toLowerCase()} track in detail. The more specific, the better the result.`}
                className="w-full bg-molecule-charcoal border border-molecule-gray/30 px-4 py-3 text-sm text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-200 resize-none"
              />
              <p className="text-[10px] text-molecule-muted mt-2">
                {customPrompt.length} characters · Paste directly into Suno.com
              </p>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateTrack}
            disabled={!prompt || isGenerating}
            className={clsx(
              "w-full py-4 text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-200 flex items-center justify-center gap-3",
              !prompt || isGenerating
                ? "bg-molecule-gray/30 text-molecule-muted cursor-not-allowed"
                : "bg-molecule-gold text-molecule-black hover:bg-molecule-gold-light"
            )}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-molecule-muted/30 border-t-molecule-gold rounded-full animate-spin" />
                Generating Track…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate &amp; Distribute Track
              </>
            )}
          </button>
        </div>

        {/* Right: info + queue */}
        <div className="flex flex-col gap-5">
          {/* Niche stats */}
          <div
            className="p-6 border"
            style={{
              borderColor: NICHE_COLORS[selectedNiche] + "30",
              backgroundColor: NICHE_COLORS[selectedNiche] + "05",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{currentNiche.icon}</span>
              <h3 className="text-sm font-semibold text-molecule-white">{currentNiche.label}</h3>
            </div>
            <p className="text-xs text-molecule-silver leading-relaxed mb-5">{currentNiche.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-molecule-black/30 p-3 rounded">
                <div className="text-xs text-molecule-muted mb-1">Avg Monthly Streams</div>
                <div className="text-sm font-semibold" style={{ color: NICHE_COLORS[selectedNiche] }}>
                  {currentNiche.avgMonthlyStreams}
                </div>
              </div>
              <div className="bg-molecule-black/30 p-3 rounded">
                <div className="text-xs text-molecule-muted mb-1">Avg Monthly Revenue</div>
                <div className="text-sm font-semibold" style={{ color: NICHE_COLORS[selectedNiche] }}>
                  {currentNiche.avgMonthlyRevenue}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow steps */}
          <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-4">
              Automation Workflow
            </h3>
            {[
              { n: 1, label: "Generate via Suno AI", time: "~30 sec" },
              { n: 2, label: "Auto-upload to DistroKid", time: "~2 min" },
              { n: 3, label: "Distribute to 150+ platforms", time: "24–48 hrs" },
              { n: 4, label: "Royalties start accumulating", time: "Ongoing" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3 py-2.5 border-b border-molecule-gray/15 last:border-b-0">
                <div className="w-6 h-6 rounded-full bg-molecule-gold/10 border border-molecule-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-molecule-gold">{step.n}</span>
                </div>
                <span className="text-xs text-molecule-silver flex-1">{step.label}</span>
                <span className="text-[10px] text-molecule-muted">{step.time}</span>
              </div>
            ))}
          </div>

          {/* Generation queue */}
          <div className="bg-molecule-dark border border-molecule-gray/20 p-6 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-4">
              Generation Queue ({queue.length})
            </h3>
            {queue.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-molecule-muted/40 text-3xl mb-3">♪</div>
                <p className="text-xs text-molecule-muted">
                  Generated tracks will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {queue.map((job) => (
                  <div
                    key={job.id}
                    className="bg-molecule-charcoal border border-molecule-gray/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-molecule-white leading-snug">
                        {job.title || "Generating title…"}
                      </p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-[10px] text-molecule-muted mb-3 line-clamp-1">
                      {job.prompt}
                    </p>
                    {(job.status === "generating" || job.status === "distributing") && (
                      <ProgressBar progress={job.progress} />
                    )}
                    {job.status === "completed" && (
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Live on Spotify, Apple Music + 4 more
                      </div>
                    )}
                    {job.status === "failed" && (
                      <p className="text-[10px] text-red-400">Generation failed — try again</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-molecule-muted text-sm">Loading studio…</div>}>
      <StudioContent />
    </Suspense>
  );
}
