/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API payloads, validated server side */
import { BACKEND_URL } from "@/lib/api";
import type { ProviderId } from "./types";

export type RunRequest = {
  provider: ProviderId;
  text: string;
  title?: string;
  customerName?: string;
  customerEmail?: string;
  ticketId?: string;
};

export type NodeEvent = {
  type: "node";
  node: string;
  next: string | null;
  durationMs: number | null;
  elapsedMs: number;
  workflowOutput: string;
  data: Record<string, any>;
};

export type StreamEvent =
  | { type: "start"; node: string }
  | NodeEvent
  | { type: "done"; result: any }
  | { type: "error"; message: string };

/** Thrown when the streaming endpoint does not exist (older backend), so callers can fall back. */
export class StreamUnavailable extends Error {}

/**
 * POST to /api/support/run/stream and parse Server-Sent Events from the response body.
 * (EventSource cannot POST, so this uses fetch + ReadableStream with the session cookie.)
 */
export async function streamRun(req: RunRequest, onEvent: (e: StreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/support/run/stream`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(req),
    signal,
  });
  if (res.status === 404 || res.status === 405) throw new StreamUnavailable();
  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.detail || j?.message || msg;
    } catch {
      /* ignore */
    }
    onEvent({ type: "error", message: String(msg) });
    return;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let name = "";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) name = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!name || !data) continue;
      try {
        const parsed = JSON.parse(data);
        if (name === "done") onEvent({ type: "done", result: parsed });
        else if (name === "error") onEvent({ type: "error", message: parsed.message || "Run failed" });
        else onEvent(parsed as StreamEvent);
      } catch {
        /* skip malformed frame */
      }
    }
  }
}
