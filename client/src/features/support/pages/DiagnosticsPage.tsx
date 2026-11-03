import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { LatencyBars, ProviderDonut } from "@/components/charts/dashboard-charts";
import { useSupport } from "../supportCtx";

const PALETTE = ["#5ad1ff", "#5be3a8", "#ffb066", "#c9b6ff", "#ff8aa6"];
const OUTCOME_STYLE: Record<string, string> = {
  success: "bg-[#5be3a81a] text-[#5be3a8]",
  fallback: "bg-[#ffb0661f] text-[#ffb066]",
};

export default function DiagnosticsPage() {
  const { metrics, metricsLoading, tickets, loadMetrics } = useSupport();
  const [outcome, setOutcome] = useState<"all" | "success" | "fallback" | "failed">("all");

  // where the time goes: averages of the per-stage latencies stored with each ticket
  const split = useMemo(() => {
    const lat = tickets.map((t) => t.telemetry?.latencies).filter(Boolean) as NonNullable<NonNullable<(typeof tickets)[number]["telemetry"]>["latencies"]>[];
    const avg = (k: "intentMs" | "kbMs" | "searchMs" | "modelMs") => (lat.length ? lat.reduce((a, l) => a + (l[k] || 0), 0) / lat.length : 0);
    const parts = [
      { k: "Intent", v: avg("intentMs"), c: "#5ad1ff" },
      { k: "Knowledge", v: avg("kbMs"), c: "#5be3a8" },
      { k: "Web search", v: avg("searchMs"), c: "#ffb066" },
      { k: "Model", v: avg("modelMs"), c: "#ff6b0a" },
    ];
    return { parts, total: parts.reduce((a, p) => a + p.v, 0), n: lat.length };
  }, [tickets]);

  const logs = useMemo(() => (metrics?.recentLogs ?? []).filter((l) => outcome === "all" || l.outcome === outcome), [metrics, outcome]);
  const bars = useMemo(() => [...(metrics?.recentLogs ?? [])].reverse().map((l) => ({ id: l.requestId.slice(0, 8), ms: Math.round(l.latencies?.totalMs ?? 0), outcome: l.outcome })), [metrics]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#767c92]">Support desk · diagnostics</div>
          <h1 className="mt-1 text-3xl font-light tracking-tight text-[#f4f1ea]">Cost &amp; latency</h1>
          <p className="mt-1 text-xs text-[#a3a8bb]">Measured token use, versioned model pricing and percentile latency for every agent run.</p>
        </div>
        <button onClick={() => loadMetrics()} className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-[#242838] px-3.5 py-2 text-xs font-semibold text-[#f4f1ea] transition hover:bg-[#151826] sm:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${metricsLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {!metrics ? (
        <div className="p-16 text-center text-xs text-[#a3a8bb]">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#FF6B0A]" /> Aggregating telemetry…
        </div>
      ) : (
        <>
          {/* headline numbers */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { l: "Requests", v: metrics.totalRequests.toLocaleString(), s: `${metrics.successfulRequests} ok · ${metrics.fallbackRequests} fallback · ${metrics.failedRequests} failed`, c: "#f4f1ea" },
              { l: "Tokens", v: metrics.totalTokens.toLocaleString(), s: `${metrics.promptTokens.toLocaleString()} in · ${metrics.completionTokens.toLocaleString()} out`, c: "#f4f1ea" },
              { l: "Spend", v: `$${metrics.totalCostUsd.toFixed(4)}`, s: metrics.totalRequests ? `$${(metrics.totalCostUsd / metrics.totalRequests).toFixed(5)} per request` : "no requests yet", c: "#5be3a8" },
              { l: "Median latency", v: `${metrics.p50LatencyMs} ms`, s: `avg ${metrics.avgLatencyMs} ms`, c: "#5ad1ff" },
              { l: "p95 latency", v: `${metrics.p95LatencyMs} ms`, s: `sample of ${metrics.sampleSize}`, c: "#ff6b0a" },
            ].map((k) => (
              <div key={k.l} className="saas-card rounded-2xl p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">{k.l}</div>
                <div className="mt-3 text-3xl font-light tracking-tight" style={{ color: k.c }}>{k.v}</div>
                <div className="mt-1 text-[11px] leading-snug text-[#a3a8bb]">{k.s}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <section className="saas-card rounded-2xl p-6 lg:col-span-8">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#f4f1ea]">Latency per request</h2>
                <div className="flex gap-4 font-mono text-[10px] uppercase tracking-wider text-[#a3a8bb]">
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#5ad1ff]" />ok</span>
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ffb066]" />fallback</span>
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ff4d3d]" />failed</span>
                </div>
              </div>
              <p className="mb-2 text-[11px] text-[#767c92]">Oldest to newest, last {bars.length} runs</p>
              {bars.length ? <LatencyBars data={bars} /> : <div className="grid h-56 place-items-center text-xs italic text-[#767c92]">Run a ticket to start collecting latency data.</div>}
            </section>

            <section className="saas-card rounded-2xl p-6 lg:col-span-4">
              <h2 className="text-sm font-bold text-[#f4f1ea]">Requests by provider</h2>
              <p className="mb-2 text-[11px] text-[#767c92]">Which model actually answered</p>
              <ProviderDonut dist={metrics.providerDistribution} />
              <ul className="mt-3 space-y-1.5">
                {Object.entries(metrics.providerDistribution).map(([name, n], i) => (
                  <li key={name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#c9c5bb]"><i className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{name}</span>
                    <span className="font-mono text-[#f4f1ea]">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* where the time goes */}
          <section className="saas-card rounded-2xl p-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-[#f4f1ea]">Where the time goes</h2>
              <span className="font-mono text-[10px] text-[#767c92]">average over {split.n} stored runs</span>
            </div>
            {split.total > 0 ? (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-[#151826]">
                  {split.parts.map((p) => <div key={p.k} title={`${p.k}: ${Math.round(p.v)} ms`} style={{ width: `${(p.v / split.total) * 100}%`, background: p.c }} />)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {split.parts.map((p) => (
                    <div key={p.k}>
                      <div className="flex items-center gap-2 text-[11px] text-[#a3a8bb]"><i className="h-2 w-2 rounded-full" style={{ background: p.c }} />{p.k}</div>
                      <div className="mt-1 font-mono text-lg text-[#f4f1ea]">{Math.round(p.v)}<span className="text-xs text-[#767c92]"> ms</span></div>
                      <div className="font-mono text-[10px] text-[#767c92]">{Math.round((p.v / split.total) * 100)}%</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-4 text-xs italic text-[#767c92]">No stored latencies yet.</p>
            )}
          </section>

          {/* request log */}
          <section className="saas-card rounded-2xl p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-sm font-bold text-[#f4f1ea]">Request log</h2>
              <div className="flex gap-1 rounded-xl border border-[#242838] bg-[#07080d] p-1">
                {(["all", "success", "fallback", "failed"] as const).map((o) => (
                  <button key={o} onClick={() => setOutcome(o)} className={`cursor-pointer rounded-lg px-3 py-1 text-[11px] font-semibold capitalize transition ${outcome === o ? "bg-[#151826] text-[#f4f1ea]" : "text-[#767c92] hover:text-[#f4f1ea]"}`}>{o}</button>
                ))}
              </div>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs italic text-[#767c92]">{metrics.recentLogs.length ? "No requests match this filter." : "No request logs yet. Run a ticket to generate telemetry."}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#242838] text-[10px] font-bold uppercase tracking-wider text-[#767c92]">
                      {["Request", "Provider / model", "Tokens", "Cost", "Latency", "Outcome"].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242838]/70">
                    {logs.map((l) => (
                      <tr key={l.requestId} className="hover:bg-[#07080d]">
                        <td className="px-3 py-2 font-mono text-[11px] text-[#767c92]" title={l.timestamp}>{l.requestId.slice(0, 12)}</td>
                        <td className="px-3 py-2"><div className="font-medium text-[#f4f1ea]">{l.provider}</div><div className="font-mono text-[10px] text-[#767c92]">{l.actualModel}</div></td>
                        <td className="px-3 py-2 font-mono">{l.totalTokens}{l.isTokenCountEstimated ? " (est)" : ""}</td>
                        <td className="px-3 py-2 font-mono text-[#5be3a8]">{l.estimatedCostUsd != null ? `$${l.estimatedCostUsd.toFixed(5)}` : "N/A"}</td>
                        <td className="px-3 py-2 font-mono">{l.latencies?.totalMs}ms</td>
                        <td className="px-3 py-2"><span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${OUTCOME_STYLE[l.outcome] ?? "bg-[#ff4d3d1f] text-[#ff8a7e]"}`}>{l.outcome}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
