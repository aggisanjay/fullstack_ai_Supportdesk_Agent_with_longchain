import { CheckCircle, Minus } from "lucide-react";
import { PIPELINE_STAGES } from "../constants";
import type { Ticket } from "../types";

/** Persisted execution trace of a finished run (from ticket.detailedSteps). */
export default function StepTrace({ ticket }: { ticket: Ticket }) {
  const steps = ticket.detailedSteps || [];
  const total = steps.reduce((a, s) => a + (s.durationMs || 0), 0) || 1;
  return (
    <div className="space-y-2.5">
      {PIPELINE_STAGES.map((stg) => {
        const d = steps.find((s) => s.stage === stg.id);
        const skipped = d?.status === "skipped";
        return (
          <div key={stg.id} className="rounded-lg border border-[#242838] bg-[#0b0d14] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {skipped ? <Minus className="h-4 w-4 shrink-0 text-[#767c92]" /> : d ? <CheckCircle className="h-4 w-4 shrink-0 text-[#7ee8a8]" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-[#323852]" />}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#f4f1ea]">{stg.label}</h4>
                  <p className="truncate text-[11px] text-[#a3a8bb]" title={d?.summary}>{d?.summary || stg.desc}</p>
                </div>
              </div>
              <span className="shrink-0 rounded border border-[#242838] bg-[#07080d] px-2 py-0.5 font-mono text-[10px] text-[#c9c5bb]">
                {d ? (skipped ? "skipped" : `${d.durationMs < 10 ? d.durationMs.toFixed(1) : Math.round(d.durationMs)} ms`) : "n/a"}
              </span>
            </div>
            {d && !skipped && (
              <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-[#151826]">
                <div className="h-full rounded-full bg-[#ff6b0a]/70" style={{ width: `${Math.max(2, (d.durationMs / total) * 100)}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
