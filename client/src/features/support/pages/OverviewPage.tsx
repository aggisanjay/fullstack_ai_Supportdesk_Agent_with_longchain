import { useMemo } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle, Cpu, Database, Inbox, Plus, Sparkles } from "lucide-react";
import { ConfidenceDonut, TrendChart } from "@/components/charts/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ESCALATION_FLOOR, PIPELINE_STAGES } from "../constants";
import { useSupport } from "../supportCtx";

const N = (n: number) => n.toLocaleString();

export default function OverviewPage() {
  const { analytics, kbArticles, providers, tickets, user, setActiveTab, setSelectedTicketId, setIsNewTicketModalOpen } = useSupport();

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open" || t.status === "pending").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const escalated = tickets.filter((t) => t.status === "escalated").length;
    const total = tickets.length;
    const conf = analytics?.averageConfidence ?? (total ? tickets.reduce((a, t) => a + (t.confidenceScore || 0), 0) / total : 0);
    return { open, resolved, escalated, total, conf, rate: total ? resolved / total : 0 };
  }, [tickets, analytics]);

  // attention queue: escalated first, then open, lowest confidence first
  const queue = useMemo(
    () =>
      tickets
        .filter((t) => t.status === "escalated" || t.status === "open" || t.status === "pending")
        .sort((a, b) => Number(b.status === "escalated") - Number(a.status === "escalated") || (a.confidenceScore || 0) - (b.confidenceScore || 0))
        .slice(0, 5),
    [tickets],
  );

  // real per-stage averages from persisted traces
  const stageAvg = useMemo(() => {
    return PIPELINE_STAGES.map((s) => {
      const vals = tickets.flatMap((t) => (t.detailedSteps || []).filter((d) => d.stage === s.id && d.status !== "skipped").map((d) => d.durationMs));
      return { ...s, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length };
    });
  }, [tickets]);
  const maxAvg = Math.max(1, ...stageAvg.map((s) => s.avg ?? 0));

  const kbByCat = useMemo(() => {
    const m: Record<string, number> = {};
    kbArticles.forEach((a) => (m[a.category] = (m[a.category] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [kbArticles]);

  const engines = providers
    ? [
        { name: providers.gemini.name, model: providers.gemini.model, ok: providers.gemini.configured, role: "primary" },
        { name: providers.openai.name, model: providers.openai.model, ok: providers.openai.configured, role: "secondary" },
        { name: providers.groq.name, model: providers.groq.model, ok: providers.groq.configured, role: "fallback" },
        { name: providers.tavily.name, model: "web grounding", ok: providers.tavily.configured, role: "search" },
      ]
    : [];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    { label: "Open queue", value: N(stats.open), icon: Inbox, tone: "#ff6b0a", hint: "awaiting a response" },
    { label: "Escalated", value: N(stats.escalated), icon: AlertTriangle, tone: "#ff8a7e", hint: "need a human lead" },
    { label: "Resolved", value: N(stats.resolved), icon: CheckCircle, tone: "#5be3a8", hint: `${Math.round(stats.rate * 100)}% of all tickets` },
    { label: "Avg confidence", value: `${Math.round(stats.conf * 100)}%`, icon: Sparkles, tone: "#5ad1ff", hint: `floor ${Math.round(ESCALATION_FLOOR * 100)}%` },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
      {/* header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#767c92]">Support desk · overview</div>
          <h1 className="mt-1 text-3xl font-light tracking-tight text-[#f4f1ea]">
            {greet}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-xs text-[#a3a8bb]">
            {stats.escalated ? `${stats.escalated} ticket${stats.escalated > 1 ? "s" : ""} escalated and waiting on you. ` : "Nothing is escalated. "}
            {stats.open} open in the queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsNewTicketModalOpen(true)} size="sm" className="rounded-xl bg-[#FF6B0A] text-xs font-bold text-[#05060a] hover:bg-[#E85B00]">
            <Plus className="h-3.5 w-3.5" /> Run a ticket
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("tickets")} className="rounded-xl text-xs font-semibold">
            <Inbox className="h-3.5 w-3.5 text-[#FF6B0A]" /> Open queue
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="saas-card relative overflow-hidden rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">{k.label}</span>
              <k.icon className="h-4 w-4" style={{ color: k.tone }} />
            </div>
            <div className="mt-3 text-4xl font-light tracking-tight text-[#f4f1ea]">{k.value}</div>
            <div className="mt-1 text-[11px] text-[#a3a8bb]">{k.hint}</div>
            <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.tone}66, transparent)` }} />
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* attention queue */}
        <section className="saas-card rounded-2xl p-6 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between border-b border-[#242838] pb-3">
            <h2 className="text-sm font-bold text-[#f4f1ea]">Needs attention</h2>
            <button onClick={() => setActiveTab("tickets")} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#FF6B0A] hover:text-[#ff8a3d]">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {queue.length === 0 ? (
            <div className="grid place-items-center gap-3 py-10 text-center">
              <CheckCircle className="h-7 w-7 text-[#5be3a8]" />
              <p className="text-xs text-[#a3a8bb]">{tickets.length ? "Queue is clear. Every ticket is resolved." : "No tickets yet. Run your first one to watch the agents work."}</p>
              {!tickets.length && <Button size="sm" onClick={() => setIsNewTicketModalOpen(true)} className="rounded-xl bg-[#FF6B0A] text-xs font-bold text-[#05060a]">Run a ticket</Button>}
            </div>
          ) : (
            <ul className="divide-y divide-[#242838]/70">
              {queue.map((t) => {
                const c = Math.round((t.confidenceScore || 0) * 100);
                return (
                  <li key={t.id}>
                    <button onClick={() => setSelectedTicketId(t.id)} className="flex w-full cursor-pointer items-center gap-4 rounded-xl px-2 py-3 text-left transition hover:bg-[#0b0d14]">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-[#f4f1ea]">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#a3a8bb]">
                          <span className="font-mono text-[#767c92]">{t.id.slice(0, 8)}</span>
                          <span>{t.customerName}</span>
                        </div>
                      </div>
                      <div className="hidden w-24 sm:block">
                        <div className="mb-1 flex justify-between font-mono text-[10px] text-[#767c92]"><span>conf</span><span>{c}%</span></div>
                        <div className="relative h-1 rounded-full bg-[#151826]">
                          <div className="h-full rounded-full" style={{ width: `${c}%`, background: c >= ESCALATION_FLOOR * 100 ? "#5be3a8" : "#ff6b0a" }} />
                          <span className="absolute top-[-2px] h-2 w-px bg-[#ffb066]" style={{ left: `${ESCALATION_FLOOR * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge variant={t.status as never}>{t.status}</Badge>
                        <Badge variant={t.sentiment as never}>{t.sentiment}</Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* pipeline health */}
        <section className="saas-card rounded-2xl p-6 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b border-[#242838] pb-3">
            <h2 className="text-sm font-bold text-[#f4f1ea]">Pipeline timing</h2>
            <span className="font-mono text-[10px] text-[#767c92]">avg per stage</span>
          </div>
          <ol className="space-y-3">
            {stageAvg.map((s, i) => (
              <li key={s.id} className="grid grid-cols-[22px_1fr_64px] items-center gap-3 text-xs">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-[#323852] font-mono text-[10px] text-[#a3a8bb]">{i + 1}</span>
                <div>
                  <div className="mb-1 flex justify-between"><span className="text-[#f4f1ea]">{s.agent}</span></div>
                  <div className="h-1 overflow-hidden rounded-full bg-[#151826]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#ff6b0a] to-[#ffb066]" style={{ width: s.avg === null ? 0 : `${Math.max(3, (s.avg / maxAvg) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-right font-mono text-[11px] text-[#a3a8bb]">{s.avg === null ? "n/a" : `${s.avg < 10 ? s.avg.toFixed(1) : Math.round(s.avg)} ms`}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] leading-relaxed text-[#767c92]">Computed from {N(tickets.filter((t) => t.detailedSteps?.length).length)} stored run traces. Web search averages only the runs that used it.</p>
        </section>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="saas-card rounded-2xl p-6 lg:col-span-5">
          <h2 className="mb-1 text-sm font-bold text-[#f4f1ea]">Weekly activity</h2>
          <p className="mb-3 text-[11px] text-[#767c92]">Resolved vs escalated</p>
          {analytics ? <TrendChart data={analytics.resolutionTrends} /> : <div className="h-60" />}
        </section>

        <section className="saas-card rounded-2xl p-6 lg:col-span-3">
          <h2 className="mb-1 text-sm font-bold text-[#f4f1ea]">Confidence</h2>
          <p className="mb-3 text-[11px] text-[#767c92]">Blended average</p>
          <ConfidenceDonut value={stats.conf} label="average" threshold={ESCALATION_FLOOR} />
        </section>

        <div className="space-y-6 lg:col-span-4">
          <section className="saas-card rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between border-b border-[#242838] pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#f4f1ea]"><Cpu className="h-4 w-4 text-[#FF6B0A]" /> Engines</h2>
              <span className="font-mono text-[10px] text-[#767c92]">{engines.filter((e) => e.ok).length}/{engines.length || 4} configured</span>
            </div>
            <ul className="space-y-2">
              {engines.length === 0 && <li className="text-xs text-[#767c92]">Loading provider status…</li>}
              {engines.map((e) => (
                <li key={e.name} className="flex items-center justify-between rounded-xl border border-[#242838] bg-[#07080d] p-2.5 text-xs">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${e.ok ? "bg-[#5be3a8]" : "bg-[#ff8a7e]"}`} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#f4f1ea]">{e.name}</div>
                      <div className="truncate font-mono text-[10px] text-[#767c92]">{e.model}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-[#a3a8bb]">{e.ok ? e.role : "no key"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="saas-card rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between border-b border-[#242838] pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#f4f1ea]"><Database className="h-4 w-4 text-[#FF6B0A]" /> Runbooks</h2>
              <button onClick={() => setActiveTab("kb")} className="cursor-pointer text-xs font-semibold text-[#FF6B0A]">Manage ({kbArticles.length})</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {kbByCat.length === 0 && <span className="text-xs text-[#767c92]">No articles yet.</span>}
              {kbByCat.map(([c, n]) => (
                <span key={c} className="rounded-full border border-[#242838] bg-[#07080d] px-3 py-1 text-[11px] text-[#c9c5bb]">{c} <b className="ml-1 font-mono text-[#f4f1ea]">{n}</b></span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
