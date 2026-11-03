import React, { useState, useRef } from "react";
import { 
  CheckCircle2, 
  Database, 
  Globe, 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react";

interface Scenario {
  id: string;
  chipLabel: string;
  tag: string;
  tagColor: string;
  ticketId: string;
  customer: string;
  email: string;
  sentiment: string;
  urgency: string;
  inquiry: string;
  intent: string;
  kbMatch: string;
  kbSimilarity: string;
  webSource: string;
  model: string;
  latencyMs: number;
  confidence: number;
  escalated: boolean;
  costUsd: string;
  solution: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "oauth",
    chipLabel: "OAuth 401",
    tag: "Bug / Auth",
    tagColor: "#5aa9d6",
    ticketId: "TKT-1042",
    customer: "Elena Rossi",
    email: "elena@fintech.co",
    sentiment: "Frustrated",
    urgency: "0.88",
    inquiry: "OAuth callback returns 401 redirect_uri_mismatch after rotating client secret in staging.",
    intent: "Technical / Integration",
    kbMatch: "Runbook #1042 · Scalekit Secret Rotation",
    kbSimilarity: "0.942",
    webSource: "RFC 6749 Auth Callback Spec",
    model: "Gemini 2.5 Flash",
    latencyMs: 1240,
    confidence: 94,
    escalated: false,
    costUsd: "$0.0004",
    solution: "Client secret rotation invalidates authorization code redirect URIs. Update your redirect URI in the admin portal to match your staging domain per Runbook #1042.",
  },
  {
    id: "billing",
    chipLabel: "Double Charge",
    tag: "Billing",
    tagColor: "#d9a35b",
    ticketId: "TKT-0812",
    customer: "Marcus Lee",
    email: "marcus@cloudscale.net",
    sentiment: "Critical",
    urgency: "0.95",
    inquiry: "Charged twice for annual enterprise license on invoice #INV-9281. Need an immediate credit or refund.",
    intent: "Billing / Refund",
    kbMatch: "Runbook #0812 · Duplicate Payment Review",
    kbSimilarity: "0.891",
    webSource: "Payment Gateway Invoicing API",
    model: "GPT-4o-mini",
    latencyMs: 1080,
    confidence: 96,
    escalated: true,
    costUsd: "$0.0005",
    solution: "Verified duplicate transaction on invoice #INV-9281. Automated refund initiated to card ending in 4092. Escalated to billing lead for confirmation.",
  },
  {
    id: "webhook",
    chipLabel: "Webhook HMAC",
    tag: "Security",
    tagColor: "#6fb58f",
    ticketId: "TKT-0419",
    customer: "Tom Becker",
    email: "tom@orbit.app",
    sentiment: "Neutral",
    urgency: "0.62",
    inquiry: "Webhook HMAC signature verification failing with Sha256 mismatch on payload header.",
    intent: "Technical / Security",
    kbMatch: "Runbook #0419 · Webhook Raw Buffer Signatures",
    kbSimilarity: "0.935",
    webSource: "Webhooks v2 HMAC Documentation",
    model: "Groq LLaMA-3.3",
    latencyMs: 540,
    confidence: 98,
    escalated: false,
    costUsd: "$0.0002",
    solution: "Signature verification must use the raw unparsed request buffer instead of JSON.stringify. Whitespace differences alter the calculated HMAC hash digest.",
  },
  {
    id: "ratelimit",
    chipLabel: "Rate Limit 429",
    tag: "Infrastructure",
    tagColor: "#9a8bd0",
    ticketId: "TKT-1190",
    customer: "Alice Johnson",
    email: "alice@acme-labs.io",
    sentiment: "Frustrated",
    urgency: "0.78",
    inquiry: "Receiving HTTP 429 Too Many Requests during morning sync batch. Where do we request limit increases?",
    intent: "Account / Quotas",
    kbMatch: "Runbook #1190 · Tier-2 Rate Limiting Policies",
    kbSimilarity: "0.912",
    webSource: "API Gateway Token Bucket Limits",
    model: "Gemini 2.5 Flash",
    latencyMs: 820,
    confidence: 92,
    escalated: false,
    costUsd: "$0.0003",
    solution: "Batch jobs should implement exponential backoff with jitter on Retry-After headers. Temporary 2x quota boost enabled for workspace #ACME-01.",
  },
];

export default function HeroAgentScene() {
  const [selectedId, setSelectedId] = useState<string>("oauth");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(4); // 0=ingest, 1=router, 2=retrieval, 3=synthesis, 4=done
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 250, y: 250 });

  const activeScenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  // 3D Parallax Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Re-run animation when scenario changes
  const handleSelectScenario = (id: string) => {
    if (id === selectedId && isSimulating) return;
    setSelectedId(id);
    setIsSimulating(true);
    setActiveStep(0);

    setTimeout(() => setActiveStep(1), 300);
    setTimeout(() => setActiveStep(2), 650);
    setTimeout(() => setActiveStep(3), 1050);
    setTimeout(() => {
      setActiveStep(4);
      setIsSimulating(false);
    }, 1450);
  };

  return (
    <div 
      className="sd-hero-scene relative w-full select-none"
      style={{ perspective: "1200px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Ambient Glow Bloom */}
      <div 
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40 blur-3xl transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle 320px at ${mousePos.x}px ${mousePos.y}px, rgba(255, 107, 10, 0.28), rgba(90, 169, 214, 0.12), transparent 70%)`
        }}
      />

      {/* Floating 3D HUD Console Container */}
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/[0.12] bg-[#0c0e15]/90 p-5 md:p-6 backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic Cursor Spotlight Border Reflection */}
        <div 
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,107,10,0.4), rgba(255,255,255,0.05) 40%, transparent 75%)`,
          }}
        />

        {/* 1. Header: Scenario Selector & Live Pulse */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold tracking-tight text-[#f4f1ea] font-sans">
              Live Agent Execution
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-300">
              LangGraph StateGraph
            </span>
          </div>

          {/* Interactive Chips: Click to test different tickets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {SCENARIOS.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectScenario(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    active
                      ? "bg-[#ff6b0a] text-[#07080d] font-bold shadow-[0_0_12px_rgba(255,107,10,0.5)]"
                      : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
                >
                  {s.chipLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Inbound Customer Ticket Glass Badge */}
        <div className="relative z-10 mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-white">
                {activeScenario.ticketId}
              </span>
              <span 
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: `${activeScenario.tagColor}1f`, color: activeScenario.tagColor }}
              >
                {activeScenario.tag}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
              <span>{activeScenario.customer}</span>
              <span className="text-gray-600">·</span>
              <span className={activeScenario.sentiment === "Critical" ? "text-red-400" : activeScenario.sentiment === "Frustrated" ? "text-amber-400" : "text-emerald-400"}>
                {activeScenario.sentiment}
              </span>
            </div>
          </div>
          <p className="text-[12.5px] text-gray-300 font-sans leading-relaxed">
            "{activeScenario.inquiry}"
          </p>
        </div>

        {/* 3. Real-Time Animated Multi-Agent Flow Pipeline */}
        <div className="relative z-10 my-4 py-2">
          {/* Animated SVG Connection Lines with Particle Glow */}
          <div className="relative w-full h-[64px]">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 460 64" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="hero-pipe-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff6b0a" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ffb066" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#5be3a8" stopOpacity="0.9" />
                </linearGradient>
                <filter id="hero-p-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Circuit Tracks */}
              <path d="M 50 32 L 140 32" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 180 32 C 220 32, 220 18, 255 18" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 180 32 C 220 32, 220 48, 255 48" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 320 18 C 355 18, 355 32, 390 32" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 320 48 C 355 48, 355 32, 390 32" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />

              {/* Live Travelling Particles */}
              <circle r="3" fill="#ff6b0a" filter="url(#hero-p-glow)">
                <animateMotion dur="2.4s" repeatCount="indefinite" path="M 50 32 L 140 32" />
              </circle>
              <circle r="3" fill="#5be3a8" filter="url(#hero-p-glow)">
                <animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M 180 32 C 220 32, 220 18, 255 18" />
              </circle>
              <circle r="3" fill="#ffb066" filter="url(#hero-p-glow)">
                <animateMotion dur="2.4s" begin="0.8s" repeatCount="indefinite" path="M 180 32 C 220 32, 220 48, 255 48" />
              </circle>
              <circle r="3" fill="#5ad1ff" filter="url(#hero-p-glow)">
                <animateMotion dur="2.4s" begin="1.4s" repeatCount="indefinite" path="M 320 18 C 355 18, 355 32, 390 32" />
              </circle>
            </svg>

            {/* Overlaid Micro-Nodes */}
            <div className="absolute inset-0 flex items-center justify-between text-[10px] font-mono pointer-events-none">
              {/* Node 1: Ingest */}
              <div className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                activeStep >= 0 
                  ? "bg-[#181a24] border-[#ff6b0a]/60 text-white shadow-[0_0_10px_rgba(255,107,10,0.3)]" 
                  : "bg-white/[0.02] border-white/[0.08] text-gray-500"
              }`}>
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#ff6b0a]" />
                  <span>Ingest</span>
                </div>
              </div>

              {/* Node 2: Classifier */}
              <div className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                activeStep >= 1 
                  ? "bg-[#181a24] border-amber-500/60 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]" 
                  : "bg-white/[0.02] border-white/[0.08] text-gray-500"
              }`}>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Route</span>
                </div>
              </div>

              {/* Node 3: Dual Grounding (pgvector + Tavily) */}
              <div className="flex flex-col gap-1">
                <div className={`px-2 py-0.5 rounded border text-[9px] transition-all ${
                  activeStep >= 2
                    ? "bg-[#181a24] border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "bg-white/[0.02] border-white/[0.08] text-gray-500"
                }`}>
                  <span className="flex items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-emerald-400" />
                    pgvector 0.94
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded border text-[9px] transition-all ${
                  activeStep >= 2
                    ? "bg-[#181a24] border-yellow-500/60 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                    : "bg-white/[0.02] border-white/[0.08] text-gray-500"
                }`}>
                  <span className="flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 text-yellow-400" />
                    Tavily Web
                  </span>
                </div>
              </div>

              {/* Node 4: Synthesis */}
              <div className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                activeStep >= 3 
                  ? "bg-[#181a24] border-sky-500/60 text-white shadow-[0_0_10px_rgba(56,189,248,0.3)]" 
                  : "bg-white/[0.02] border-white/[0.08] text-gray-500"
              }`}>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>{activeScenario.model.split(" ")[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Grounded Response Draft Card */}
        <div className="relative z-10 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.06]">
            <span className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Tier-2 Resolution Draft
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#ff6b0a]" />
                {activeScenario.latencyMs}ms
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-bold">
                {activeScenario.confidence}% Confidence
              </span>
            </div>
          </div>

          <p className="text-[12px] text-gray-200 font-sans leading-relaxed mb-3">
            {activeScenario.solution}
          </p>

          {/* Citations & Safeguard Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[10.5px] font-mono">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {activeScenario.kbMatch.split("·")[0].trim()}
              </span>
              <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                {activeScenario.webSource.split(" ")[0]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeScenario.escalated ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> Escalated to Human Lead
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Auto-Approved
                </span>
              )}
              <span className="text-gray-500">{activeScenario.costUsd}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
