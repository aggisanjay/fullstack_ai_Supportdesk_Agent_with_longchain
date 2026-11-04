import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Landing3D, { type SceneApi } from "../landing3d/Landing3D";

const CHAPTERS = [
  {
    label: "Ingest",
    title: "Every ticket, read before anyone opens it.",
    body: "The ingestion agent validates the message and reads the customer's sentiment, so a frustrated customer is visible the moment a ticket lands.",
    facts: [["Sentiment", "positive · neutral · frustrated · critical"], ["Input", "free text, no template needed"], ["Stored", "ticket + full message thread"]],
    range: [0.16, 0.22, 0.34, 0.38],
  },
  {
    label: "Classify",
    title: "Filed into five intents, in milliseconds.",
    body: "The intent agent sorts each ticket and decides if the web is needed. Routing is rule-based today, which keeps it fast and predictable.",
    facts: [["Intents", "bug · billing · account · feature · general"], ["Method", "keyword rules"], ["Decides", "whether to search the web"]],
    range: [0.4, 0.45, 0.56, 0.6],
  },
  {
    label: "Ground",
    title: "The draft cites the runbooks it came from.",
    body: "The knowledge agent embeds the ticket and pulls the nearest runbook chunks from pgvector. If they fall short, the search agent adds live web sources.",
    facts: [["Embeddings", "1,536 dimensions"], ["Chunks", "500 characters, 50 overlap"], ["Distance", "cosine, top matches kept"]],
    range: [0.62, 0.67, 0.78, 0.82],
  },
  {
    label: "Decide",
    title: "Answer it, or hand it to a person.",
    body: "Confidence blends retrieval similarity with the model's own estimate. Below 70%, or for a frustrated or critical customer, the ticket escalates with the draft attached.",
    facts: [["Floor", "70% blended confidence"], ["Also escalates", "frustrated or critical sentiment"], ["Recorded", "model, tokens and USD per run"]],
    range: [0.84, 0.89, 0.98, 1.0],
  },
] as const;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const trap = (p: number, r: readonly number[]) => (p < r[0] ? 0 : p < r[1] ? (p - r[0]) / (r[1] - r[0]) : p < r[2] ? 1 : p < r[3] ? 1 - (p - r[2]) / (r[3] - r[2]) : 0);

type Props = { signedIn: boolean; onPrimary: () => void; onSeeHow: (el: HTMLElement) => void };

export default function StageSection({ signedIn, onPrimary, onSeeHow }: Props) {
  const section = useRef<HTMLElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const chapters = useRef<Array<HTMLDivElement | null>>([]);
  const rail = useRef<HTMLDivElement>(null);
  const api = useRef<SceneApi | null>(null);
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
      api.current?.setProgress(p);
      const h = hero.current;
      if (h) {
        const o = trap(p, [-1, -0.5, 0.07, 0.14]);
        h.style.opacity = String(o);
        h.style.transform = `translateY(${(1 - o) * -40}px)`;
        h.style.filter = `blur(${(1 - o) * 12}px)`;
        h.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
      CHAPTERS.forEach((c, i) => {
        const node = chapters.current[i];
        if (!node) return;
        const o = trap(p, c.range);
        node.style.opacity = String(o);
        node.style.transform = `translateY(${(p < c.range[1] ? 1 - o : -(1 - o)) * 28}px)`;
        node.style.filter = `blur(${(1 - o) * 10}px)`;
        node.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      if (rail.current) rail.current.style.setProperty("--fill", String(clamp((p - 0.16) / 0.82)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const heroBlock = (
    <>
      <p className="sd-kicker">Multi-agent support desk</p>
      <h1 className="sd-display">
        Every answer<br />has a <em>runbook</em><br />behind it.
      </h1>
      <p className="sd-lede">
        SupportDesk AI reads each ticket, finds the runbooks and sources that apply, drafts a Tier-2 reply, and escalates to a person when confidence drops below 70%.
      </p>
      <div className="sd-actions">
        <button className="sd-btn sd-btn-primary" onClick={onPrimary}>
          {signedIn ? "Open the console" : "Get started"} <ArrowUpRight size={16} />
        </button>
        <button className="sd-btn sd-btn-ghost" onClick={() => section.current && onSeeHow(section.current)}>
          See how it works <ArrowDown size={15} />
        </button>
      </div>
    </>
  );

  return (
    <section ref={section} id="method" aria-label="How SupportDesk turns a ticket into a cited answer" className="sd-stage" style={{ height: reduce ? "auto" : "560svh" }}>
      <div className="sd-sticky">
        <div className="sd-canvas-wrap">
          <Landing3D onReady={(a) => { api.current = a; }} />
        </div>
        <div className="sd-stage-copy">
          <div ref={hero} className="sd-slot sd-hero">{heroBlock}</div>
          {!reduce &&
            CHAPTERS.map((c, i) => (
              <div key={c.label} ref={(el) => { chapters.current[i] = el; }} className="sd-slot" style={{ opacity: 0 }}>
                <p className="sd-step">Step {i + 1} of {CHAPTERS.length} · {c.label}</p>
                <h2 className="sd-title">{c.title}</h2>
                <p className="sd-body">{c.body}</p>
                <dl className="sd-facts">
                  {c.facts.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </div>
            ))}
        </div>
        {!reduce && (
          <div ref={rail} className="sd-rail" aria-hidden="true">
            <i />
            {CHAPTERS.map((c) => <span key={c.label}>{c.label}</span>)}
          </div>
        )}
      </div>
      {reduce && (
        <div className="sd-static-chapters">
          {CHAPTERS.map((c, i) => (
            <div key={c.label}>
              <p className="sd-step">Step {i + 1} of {CHAPTERS.length} · {c.label}</p>
              <h2 className="sd-title">{c.title}</h2>
              <p className="sd-body">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
