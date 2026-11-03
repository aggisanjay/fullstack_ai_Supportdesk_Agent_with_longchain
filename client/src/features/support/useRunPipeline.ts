/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API payloads, validated server side */
import { useCallback, useEffect, useRef, useState } from "react";
import { apiPost } from "@/lib/api";
import { PIPELINE_STAGES, type StageId } from "./constants";
import { StreamUnavailable, streamRun, type NodeEvent, type RunRequest, type StreamEvent } from "./stream";

export type StageStatus = "queued" | "running" | "done" | "skipped";
export type StageState = {
  status: StageStatus;
  startedAt?: number; // ms since the run started
  durationMs?: number | null;
  summary?: string;
  rows?: Array<[string, string]>;
  items?: Array<{ label: string; value?: string; pct?: number; href?: string }>;
};

export type RunState = {
  status: "idle" | "running" | "done" | "error";
  request?: RunRequest;
  mode?: "stream" | "fallback";
  stages: Record<StageId, StageState>;
  elapsedMs: number;
  result?: any;
  error?: string;
};

const blank = (): Record<StageId, StageState> =>
  Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, { status: "queued" } as StageState])) as Record<StageId, StageState>;

const idle: RunState = { status: "idle", stages: blank(), elapsedMs: 0 };

const pct = (n: unknown) => `${Math.round(Number(n || 0) * 100)}%`;

/** Fold one real LangGraph node event into the per-stage view model. */
function applyNode(prev: Record<StageId, StageState>, ev: NodeEvent, now: number): Record<StageId, StageState> {
  const s = { ...prev };
  const d = ev.data || {};
  const run = (id: StageId): StageState => ({ ...s[id], status: "running", startedAt: now });  // ms since run start
  const nextStage = ev.next ? PIPELINE_STAGES.find((p) => p.node === ev.next) : undefined;

  switch (ev.node) {
    case "ingest_and_classify":
      s.ingestion = { status: "done", durationMs: null, summary: "Message read and validated" };
      s.intent_classification = {
        status: "done",
        durationMs: ev.durationMs,
        summary: `Classified as ${d.intentCategory}`,
        rows: [
          ["Category", String(d.intentCategory)],
          ["Needs web search", d.requiresWebSearch ? "yes" : "no"],
          ["Routing reason", String(d.searchReasoning || "")],
        ],
      };
      break;
    case "retrieve_knowledge":
      s.kb_retrieval = {
        status: "done",
        durationMs: ev.durationMs,
        summary: d.matchCount ? `${d.matchCount} chunk match${d.matchCount > 1 ? "es" : ""} from the knowledge base` : "No internal article matched",
        items: (d.matches || []).map((m: { title: string; score: number }) => ({ label: m.title, value: pct(m.score), pct: m.score * 100 })),
      };
      break;
    case "ground_web_search":
      s.web_search = {
        status: "done",
        durationMs: ev.durationMs,
        summary: d.resultCount ? `${d.resultCount} source${d.resultCount > 1 ? "s" : ""} retrieved` : "Search returned no results",
        rows: d.query ? [["Query", String(d.query)]] : [],
        items: (d.results || []).map((r: { title: string; url: string }) => ({ label: r.title || r.url, value: safeHost(r.url), href: r.url })),
      };
      break;
    case "synthesize_draft":
      s.ai_synthesis = {
        status: "done",
        durationMs: ev.durationMs,
        summary: `Drafted ${d.replyChars} characters with ${d.model}`,
        rows: [
          ["Provider", String(d.provider)],
          ["Model", String(d.model)],
          ["Sentiment", String(d.sentiment)],
          ["Model confidence", pct(d.llmConfidence)],
        ],
      };
      break;
    case "guardrails_and_accounting":
      s.guardrails = {
        status: "done",
        durationMs: null,
        summary: d.escalated ? "Escalated to a human lead" : "Passed the confidence threshold",
        rows: [
          ["Blended confidence", pct(d.blendedConfidence)],
          ["Decision", d.escalated ? "Escalate (Tier-2)" : "Keep as AI draft"],
          ["Tokens", String(d.totalTokens ?? "n/a")],
          ["Cost", String(d.formattedCost ?? "n/a")],
        ],
      };
      break;
  }

  // web search is conditional: if the graph went straight from KB to synthesis, it really was skipped
  if (ev.node === "retrieve_knowledge" && ev.next === "synthesize_draft") {
    s.web_search = { status: "skipped", summary: "Skipped: internal knowledge was confident enough", durationMs: null };
  }
  if (nextStage && s[nextStage.id].status === "queued") s[nextStage.id] = run(nextStage.id);
  return s;
}

function safeHost(u: string) {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

/** Runs the agent pipeline and exposes a live, event-driven view of it. */
export function useRunPipeline() {
  const [state, setState] = useState<RunState>(idle);
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);

  const stopTimer = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => () => {
    stopTimer();
    abort.current?.abort();
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    abort.current?.abort();
    setState({ ...idle, stages: blank() });
  }, []);

  const run = useCallback(async (req: RunRequest): Promise<any | null> => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    t0.current = performance.now();
    stopTimer();
    timer.current = window.setInterval(() => setState((s) => (s.status === "running" ? { ...s, elapsedMs: Math.round(performance.now() - t0.current) } : s)), 50);

    const stages = blank();
    stages.ingestion = { status: "running", startedAt: 0 };
    setState({ status: "running", request: req, mode: "stream", stages, elapsedMs: 0 });

    let result: any = null;
    let failed: string | null = null;

    const onEvent = (ev: StreamEvent) => {
      if (ev.type === "node") setState((s) => ({ ...s, stages: applyNode(s.stages, ev, Math.round(performance.now() - t0.current)) }));
      else if (ev.type === "done") result = ev.result;
      else if (ev.type === "error") failed = ev.message;
    };

    try {
      await streamRun(req, onEvent, ac.signal);
    } catch (e) {
      if (ac.signal.aborted) return null;
      if (e instanceof StreamUnavailable || e instanceof TypeError) {
        // older backend / blocked stream: run normally and say so (no simulated progress)
        setState((s) => ({ ...s, mode: "fallback" }));
        const res = await apiPost<any>("/api/support/run", req);
        if (res.ok) result = res.data;
        else failed = (res.data as any)?.detail || "Run failed";
      } else failed = e instanceof Error ? e.message : "Run failed";
    }

    stopTimer();
    const elapsed = Math.round(performance.now() - t0.current);
    if (failed || !result) {
      setState((s) => ({ ...s, status: "error", elapsedMs: elapsed, error: failed || "The run ended without a result" }));
      return null;
    }
    // authoritative durations/summaries from the persisted trace
    setState((s) => {
      const st = { ...s.stages };
      for (const d of (result.detailedSteps || []) as Array<{ stage: StageId; durationMs: number; status: string; summary: string }>) {
        if (!st[d.stage]) continue;
        st[d.stage] = {
          ...st[d.stage],
          status: d.status === "skipped" ? "skipped" : "done",
          durationMs: d.durationMs,
          summary: d.summary || st[d.stage].summary,
        };
      }
      return { ...s, status: "done", elapsedMs: elapsed, stages: st, result };
    });
    return result;
  }, []);

  return { state, run, reset };
}
