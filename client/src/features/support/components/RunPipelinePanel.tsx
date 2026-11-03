import { useEffect } from "react";
import { AlertTriangle, ArrowUpRight, Check, ExternalLink, Loader2, Minus, RotateCcw, X } from "lucide-react";
import { ESCALATION_FLOOR, PIPELINE_STAGES } from "../constants";
import type { RunState, StageState } from "../useRunPipeline";

type Props = {
  run: RunState;
  onClose: () => void;
  onOpenTicket: (id: string) => void;
  onRetry: () => void;
};

const ms = (n?: number | null) => (n === null || n === undefined ? "" : n < 10 ? `${n.toFixed(1)} ms` : `${Math.round(n)} ms`);

function ConfidenceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ok = value >= ESCALATION_FLOOR;
  const tick = (ESCALATION_FLOOR * 360 - 90) * (Math.PI / 180);
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-label={`Confidence ${Math.round(value * 100)}%`}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="#151826" strokeWidth="6" />
      <circle
        cx="34" cy="34" r={r} fill="none" stroke={ok ? "#5be3a8" : "#ff6b0a"} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 34 34)"
        style={{ transition: "stroke-dasharray .9s cubic-bezier(.22,1,.36,1)" }}
      />
      <line x1={34 + Math.cos(tick) * 20} y1={34 + Math.sin(tick) * 20} x2={34 + Math.cos(tick) * 32} y2={34 + Math.sin(tick) * 32} stroke="#ffb066" strokeWidth="2" />
      <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="#f4f1ea" fontFamily="JetBrains Mono, monospace">
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

function StageCard({ index, stage, st, elapsed }: { index: number; stage: (typeof PIPELINE_STAGES)[number]; st: StageState; elapsed: number }) {
  const running = st.status === "running";
  const done = st.status === "done";
  const skipped = st.status === "skipped";
  const live = running ? Math.max(0, elapsed - (st.startedAt ?? 0)) : null;
  return (
    <li className="relative pl-9">
      {/* rail */}
      {index < PIPELINE_STAGES.length - 1 && (
        <span className={`absolute left-[13px] top-7 bottom-[-14px] w-px ${done || skipped ? "bg-[#5be3a8]/40" : "bg-[#242838]"}`} />
      )}
      <span
        className={`absolute left-0 top-0.5 grid h-[27px] w-[27px] place-items-center rounded-full border text-[11px] ${
          running ? "border-[#ff6b0a] bg-[#ff6b0a1a] text-[#ff6b0a]" : done ? "border-[#5be3a8]/50 bg-[#5be3a81a] text-[#5be3a8]" : skipped ? "border-[#323852] text-[#767c92]" : "border-[#242838] text-[#4b5167]"
        }`}
      >
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : skipped ? <Minus className="h-3.5 w-3.5" /> : index + 1}
      </span>

      <div className={`rounded-xl border p-3.5 transition-all duration-500 ${running ? "border-[#ff6b0a]/60 bg-[#ff6b0a0d]" : "border-[#242838] bg-[#0b0d14]"} ${st.status === "queued" ? "opacity-50" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#767c92]">{stage.agent}</div>
            <h4 className="text-[13px] font-semibold text-[#f4f1ea]">{stage.label}</h4>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#a3a8bb]">{st.summary || stage.desc}</p>
          </div>
          <span className="shrink-0 rounded-md border border-[#242838] bg-[#07080d] px-2 py-0.5 font-mono text-[10px] text-[#c9c5bb]">
            {running ? `${Math.round(live ?? 0)} ms…` : done ? ms(st.durationMs) || "done" : skipped ? "skipped" : "queued"}
          </span>
        </div>

        {(st.rows?.length || st.items?.length) && (done || skipped) ? (
          <div className="mt-3 space-y-2 border-t border-[#242838] pt-3">
            {st.rows?.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 text-[11.5px]">
                <span className="text-[#767c92]">{k}</span>
                <span className="max-w-[70%] truncate text-right font-mono text-[#f4f1ea]" title={v}>{v}</span>
              </div>
            ))}
            {st.items?.map((it, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-[11.5px]">
                  {it.href ? (
                    <a href={it.href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 truncate text-[#5ad1ff] hover:underline">
                      <span className="truncate">{it.label}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="truncate text-[#f4f1ea]">{it.label}</span>
                  )}
                  <span className="shrink-0 font-mono text-[#a3a8bb]">{it.value}</span>
                </div>
                {it.pct !== undefined && (
                  <div className="h-1 overflow-hidden rounded-full bg-[#151826]">
                    <div className="h-full rounded-full bg-[#ff6b0a]" style={{ width: `${it.pct}%`, transition: "width .8s cubic-bezier(.22,1,.36,1)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function RunPipelinePanel({ run, onClose, onOpenTicket, onRetry }: Props) {
  const open = run.status !== "idle";
  const finished = run.status === "done" || run.status === "error";

  useEffect(() => {
    if (!finished) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [finished, onClose]);

  if (!open) return null;

  const result = run.result;
  const conf = Number(result?.confidenceScore ?? 0);
  const escalated = Boolean(result?.escalation);
  const doneCount = PIPELINE_STAGES.filter((s) => ["done", "skipped"].includes(run.stages[s.id].status)).length;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-label="Live agent run">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={finished ? onClose : undefined} />
      <aside className="relative flex h-full w-full max-w-[560px] flex-col border-l border-[#242838] bg-[#07080d] shadow-2xl">
        {/* header */}
        <div className="border-b border-[#242838] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#767c92]">
                <span className={`h-1.5 w-1.5 rounded-full ${run.status === "running" ? "animate-pulse bg-[#ff6b0a]" : run.status === "error" ? "bg-[#ff4d3d]" : "bg-[#5be3a8]"}`} />
                {run.status === "running" ? "Pipeline running" : run.status === "error" ? "Run failed" : "Run complete"}
                {run.request?.provider && <span className="text-[#ffb066]">· {run.request.provider}</span>}
              </div>
              <div className="mt-2 font-mono text-4xl font-light tracking-tight text-[#f4f1ea]">
                {(run.elapsedMs / 1000).toFixed(2)}<span className="ml-1 text-base text-[#767c92]">s</span>
              </div>
            </div>
            {finished && (
              <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-[#242838] text-[#a3a8bb] hover:text-[#f4f1ea]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-3 line-clamp-2 rounded-lg border border-[#242838] bg-[#0b0d14] p-3 text-[12px] leading-relaxed text-[#a3a8bb]">{run.request?.text}</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#151826]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ff6b0a] to-[#ffb066]" style={{ width: `${(doneCount / PIPELINE_STAGES.length) * 100}%`, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-mono text-[#767c92]">
            <span>{doneCount}/{PIPELINE_STAGES.length} stages</span>
            <span>{run.mode === "fallback" ? "stream unavailable · single response" : "live from LangGraph"}</span>
          </div>
        </div>

        {/* stages */}
        <div className="flex-1 overflow-y-auto p-5">
          <ol className="space-y-3.5">
            {PIPELINE_STAGES.map((s, i) => (
              <StageCard key={s.id} index={i} stage={s} st={run.stages[s.id]} elapsed={run.elapsedMs} />
            ))}
          </ol>
        </div>

        {/* footer */}
        <div className="border-t border-[#242838] bg-[#0b0d14] p-5">
          {run.status === "running" && <div className="flex items-center gap-2 text-xs text-[#a3a8bb]"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff6b0a]" /> Agents are working. This panel updates as each node finishes.</div>}
          {run.status === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs text-[#ff8a7e]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {run.error}</div>
              <div className="flex gap-2">
                <button onClick={onRetry} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#f4f1ea] px-3.5 py-2 text-xs font-semibold text-[#05060a]"><RotateCcw className="h-3.5 w-3.5" /> Retry</button>
                <button onClick={onClose} className="cursor-pointer rounded-lg border border-[#242838] px-3.5 py-2 text-xs text-[#f4f1ea]">Dismiss</button>
              </div>
            </div>
          )}
          {run.status === "done" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ConfidenceRing value={conf} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${escalated ? "text-[#ffb066]" : "text-[#5be3a8]"}`}>
                    {escalated ? "Escalated to a human lead" : "Draft ready for review"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-[#a3a8bb]">
                    {result?.confidenceBreakdown || `Blended confidence against a ${Math.round(ESCALATION_FLOOR * 100)}% floor.`}
                  </div>
                  <div className="mt-1.5 flex gap-3 font-mono text-[10.5px] text-[#767c92]">
                    <span>{result?.telemetry?.formattedCost ?? ""}</span>
                    <span>{result?.telemetry?.totalTokens ? `${result.telemetry.totalTokens} tokens` : ""}</span>
                    <span>{result?.telemetry?.model ?? ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => result?.ticket?.id && onOpenTicket(result.ticket.id)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#ff6b0a] px-4 py-2 text-xs font-semibold text-[#05060a] hover:bg-[#ff7d26]">
                  Open ticket <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={onClose} className="cursor-pointer rounded-lg border border-[#242838] px-4 py-2 text-xs text-[#f4f1ea] hover:bg-[#151826]">Close</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
