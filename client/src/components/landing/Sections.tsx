import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Minus, Plus, X } from "lucide-react";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/* ---------------------------- scroll reveal ---------------------------- */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sd-reveal ${on ? "is-on" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------ manifesto ------------------------------ */
const WORDS = "Most help desks hand you a draft and ask you to trust it. SupportDesk shows the runbook it came from, the model that wrote it, and what it cost.".split(" ");

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const spans = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = reduce ? 1 : clamp((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3));
      spans.current.forEach((s, i) => {
        if (!s) return;
        const a = i / WORDS.length;
        s.style.opacity = String(0.16 + 0.84 * clamp((p - a) / (1.6 / WORDS.length)));
      });
    };
    run();
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    return () => {
      window.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
    };
  }, []);
  return (
    <section className="sd-sec sd-manifesto">
      <div ref={ref} className="sd-wrap">
        <p>
          {WORDS.map((w, i) => (
            <span key={i} ref={(el) => { spans.current[i] = el; }}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- bento -------------------------------- */
const MODELS = [
  { id: "gemini", name: "Gemini 2.5 Flash", model: "gemini-2.5-flash", inP: 0.075, outP: 0.3 },
  { id: "openai", name: "OpenAI", model: "gpt-4o-mini", inP: 0.15, outP: 0.6 },
  { id: "groq", name: "Groq", model: "llama-3.3-70b-versatile", inP: 0.59, outP: 0.79 },
] as const;

function Card({ title, body, children, wide }: { title: string; body: string; children: ReactNode; wide?: boolean }) {
  return (
    <Reveal className={`sd-card ${wide ? "sd-wide" : ""}`}>
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="sd-card-demo">{children}</div>
    </Reveal>
  );
}

function FailoverDemo() {
  const [down, setDown] = useState<Record<string, boolean>>({ gemini: false, openai: false, groq: false });
  const answered = MODELS.find((m) => !down[m.id]);
  return (
    <div className="sd-demo">
      <div className="sd-chain">
        {MODELS.map((m, i) => {
          const isAns = answered?.id === m.id;
          return (
            <button key={m.id} onClick={() => setDown((d) => ({ ...d, [m.id]: !d[m.id] }))} className={`sd-node ${down[m.id] ? "is-down" : ""} ${isAns ? "is-live" : ""}`} aria-pressed={down[m.id]}>
              <span className="sd-node-i">{i + 1}</span>
              <span className="sd-node-n">{m.name}</span>
              <span className="sd-node-s">{down[m.id] ? "down" : isAns ? "answering" : "standby"}</span>
            </button>
          );
        })}
      </div>
      <p className="sd-demo-out">
        {answered ? <>Answered by <b>{answered.model}</b>{answered.id !== "gemini" && <> · fallback recorded on the ticket</>}</> : <>All providers down. The run fails and the error is shown.</>}
      </p>
      <p className="sd-hint">Click a provider to take it down.</p>
    </div>
  );
}

function ThresholdDemo() {
  const [conf, setConf] = useState(78);
  const [sent, setSent] = useState<"positive" | "neutral" | "frustrated" | "critical">("neutral");
  const esc = conf < 70 || sent === "frustrated" || sent === "critical";
  return (
    <div className="sd-demo">
      <label className="sd-range">
        <span>Blended confidence <b>{conf}%</b></span>
        <input type="range" min={30} max={99} value={conf} onChange={(e) => setConf(+e.target.value)} />
        <i className="sd-floor" style={{ left: `${((70 - 30) / 69) * 100}%` }} />
      </label>
      <div className="sd-seg" role="group" aria-label="Customer sentiment">
        {(["positive", "neutral", "frustrated", "critical"] as const).map((s) => (
          <button key={s} className={sent === s ? "on" : ""} onClick={() => setSent(s)}>{s}</button>
        ))}
      </div>
      <p className={`sd-verdict ${esc ? "bad" : "ok"}`}>
        {esc ? <X size={15} /> : <Check size={15} />}
        {esc ? "Escalated to a human lead, draft attached" : "Kept as an AI draft"}
      </p>
    </div>
  );
}

function CostDemo() {
  const [m, setM] = useState(0);
  const [pt, setPt] = useState(1800);
  const [ct, setCt] = useState(420);
  const mod = MODELS[m];
  const cost = (pt * mod.inP + ct * mod.outP) / 1_000_000;
  return (
    <div className="sd-demo">
      <div className="sd-seg" role="group" aria-label="Model">
        {MODELS.map((x, i) => <button key={x.id} className={m === i ? "on" : ""} onClick={() => setM(i)}>{x.model.split("-versatile")[0]}</button>)}
      </div>
      <label className="sd-range"><span>Prompt tokens <b>{pt.toLocaleString()}</b></span><input type="range" min={200} max={8000} step={100} value={pt} onChange={(e) => setPt(+e.target.value)} /></label>
      <label className="sd-range"><span>Completion tokens <b>{ct.toLocaleString()}</b></span><input type="range" min={50} max={2000} step={50} value={ct} onChange={(e) => setCt(+e.target.value)} /></label>
      <p className="sd-cost">${cost.toFixed(6)}<small> per ticket · ${mod.inP} / ${mod.outP} per 1M tokens</small></p>
    </div>
  );
}

function CiteDemo() {
  return (
    <div className="sd-demo sd-draft">
      <p className="sd-draft-h">Draft reply · TKT-1047</p>
      <p>Hi Alice, this error means the callback URL sent to the provider is not on your allow list.<sup>[1]</sup> Add the exact URL, including the trailing path, under your app's redirect settings.<sup>[2]</sup></p>
      <ol>
        <li><b>[1]</b> OAuth redirect URIs <span>kb-0142 · cosine 0.91</span></li>
        <li><b>[2]</b> Registering callback URLs <span>kb-0142 · cosine 0.88</span></li>
      </ol>
    </div>
  );
}

function SecurityDemo() {
  const rows: Array<[string, string]> = [
    ["Sign-in", "Scalekit OAuth single sign-on"],
    ["Session", "httpOnly JWT cookie, no token in JavaScript"],
    ["Tracing", "request ID on every call"],
    ["Tests", "unit, security and integration suites"],
  ];
  return (
    <dl className="sd-sec-list">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

export function Bento() {
  return (
    <section id="product" className="sd-sec sd-bento">
      <div className="sd-wrap">
        <Reveal><p className="sd-kicker">The product, working</p></Reveal>
        <Reveal delay={60}><h2 className="sd-h2">Try the parts that matter.</h2></Reveal>
        <div className="sd-grid">
          <Card wide title="A provider goes down. The desk doesn't." body="Synthesis tries Gemini first, then OpenAI, then Groq. The model that actually answered is saved with the ticket."><FailoverDemo /></Card>
          <Card title="Know when not to answer." body="One rule decides escalation: confidence under 70%, or a frustrated or critical customer."><ThresholdDemo /></Card>
          <Card title="Every answer has a price." body="Tokens are counted per run and priced from a versioned table. Move the sliders to see the arithmetic."><CostDemo /></Card>
          <Card title="Claims you can check." body="Drafts carry citations back to the runbook chunks and web sources they used."><CiteDemo /></Card>
          <Card title="Built for a real team." body="Enterprise sign-in, cookie sessions and a test suite from day one."><SecurityDemo /></Card>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- stack -------------------------------- */
const STACK: Array<[string, string]> = [
  ["Agents", "LangGraph state graph, six reported stages"],
  ["API", "FastAPI, async SQLAlchemy 2.0, Alembic migrations"],
  ["Vectors", "PostgreSQL with pgvector, 1,536 dimensions"],
  ["Models", "Gemini, OpenAI, Groq with automatic failover"],
  ["Search", "Tavily for live web grounding"],
  ["Console", "React 19, Vite, typed end to end"],
];
export function Stack() {
  return (
    <section id="stack" className="sd-sec sd-stack">
      <div className="sd-wrap sd-split">
        <div>
          <Reveal><p className="sd-kicker">Under the hood</p></Reveal>
          <Reveal delay={60}><h2 className="sd-h2">Boring, inspectable parts.</h2></Reveal>
          <Reveal delay={120}><p className="sd-body">Nothing is a black box. Every run stores its stage trace, timings, model, token counts and cost, so you can open any ticket and see exactly what happened.</p></Reveal>
        </div>
        <Reveal delay={100}>
          <dl className="sd-table">
            {STACK.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- faq --------------------------------- */
const FAQ: Array<[string, string]> = [
  ["Does it reply to customers on its own?", "No. It writes a Tier-2 draft inside the console and never emails customers by itself. A person decides what gets sent."],
  ["How are tickets classified?", "With keyword rules into bug report, billing, account or access, feature request, and general. It is fast and predictable. It also decides whether a web search is needed."],
  ["What if a model provider is down?", "The run falls through Gemini, OpenAI and Groq in that order. The ticket records which model answered and that a fallback was used."],
  ["What do the embeddings run on?", "Gemini embeddings or OpenAI text-embedding-3-small, both at 1,536 dimensions, stored in PostgreSQL with pgvector."],
  ["Where does my data live?", "In the PostgreSQL database you point it at. The reference setup uses Neon, but any PostgreSQL 16 with pgvector works."],
];
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="sd-sec sd-faq">
      <div className="sd-wrap sd-split">
        <div><Reveal><p className="sd-kicker">Questions</p></Reveal><Reveal delay={60}><h2 className="sd-h2">Straight answers.</h2></Reveal></div>
        <div className="sd-acc">
          {FAQ.map(([q, a], i) => (
            <div key={q} className={open === i ? "is-open" : ""}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span>{q}</span>{open === i ? <Minus size={18} /> : <Plus size={18} />}
              </button>
              <div className="sd-acc-body"><p>{a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- close -------------------------------- */
export function Closing({ signedIn, onPrimary }: { signedIn: boolean; onPrimary: () => void }) {
  return (
    <section className="sd-sec sd-closing">
      <div className="sd-wrap">
        <Reveal><h2 className="sd-display">Give every ticket<br />a <em>second reader.</em></h2></Reveal>
        <Reveal delay={100}><p className="sd-lede">Open the console, run a ticket, and watch each agent report back as it finishes.</p></Reveal>
        <Reveal delay={160}>
          <button className="sd-btn sd-btn-primary" onClick={onPrimary}>{signedIn ? "Open the console" : "Get started"} <ArrowUpRight size={16} /></button>
        </Reveal>
      </div>
    </section>
  );
}
