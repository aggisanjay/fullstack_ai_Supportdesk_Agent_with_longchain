import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { 
  Bot, 
  ArrowRight, 
  Play, 
  Check, 
  ChevronDown, 
  Zap, 
  MessageSquare, 
  UserCheck, 
  BookOpen, 
  BarChart3, 
  Layers, 
  Plug, 
  GraduationCap, 
  Rocket, 
  ShoppingBag, 
  Database
} from "lucide-react";
import HeroChatDemo from "@/components/landing/HeroChatDemo";
import InteractiveSandbox from "@/components/landing/InteractiveSandbox";
import TestimonialCarousel from "@/components/landing/TestimonialCarousel";

import AuthModal from "@/components/common/AuthModal";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [timelineStep, setTimelineStep] = useState(0);

  // Auto-advance timeline steps sequentially
  useEffect(() => {
    const timer = setInterval(() => {
      setTimelineStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    if (user) {
      navigate("/support");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const trustLogos = [
    { name: "Gusto", icon: Layers },
    { name: "Stripe", icon: Zap },
    { name: "Shopify", icon: ShoppingBag },
    { name: "Notion", icon: BookOpen },
    { name: "HubSpot", icon: Database },
    { name: "Intercom", icon: MessageSquare },
    { name: "Figma", icon: Layers },
    { name: "Linear", icon: Zap }
  ];


  const faqs = [
    {
      q: "How does the AI learn about our product?",
      a: "SupportDesk AI syncs directly with your help center, Notion/Confluence docs, and past ticket history via one-click OAuth. It vectorizes and indexes your knowledge base in minutes, testing against synthetic edge cases before handling customer conversations."
    },
    {
      q: "What happens when the AI doesn't know an answer?",
      a: "When confidence drops below your threshold or an emotional/critical sentiment is detected, Aria seamlessly transfers the ticket to your human team with the complete conversation summary, sentiment telemetry, and a pre-drafted response."
    },
    {
      q: "Can we control which channels the AI responds on?",
      a: "Yes. You can selectively enable autonomous replies for Slack, WhatsApp, live chat, email, or ticketing inboxes independently, or set it to run in shadow draft mode first."
    },
    {
      q: "How fast is setup and onboarding?",
      a: "Most teams go live within 20 minutes. There is no code migration or complex configuration required — just connect your channels, upload documents, and toggle the agent on."
    },
    {
      q: "Is customer data encrypted and private?",
      a: "All data is encrypted in transit and at rest with AES-256 and TLS 1.3. We do not use your customer queries to train public foundational models, and full PII redaction is applied automatically."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 font-sans selection:bg-violet-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="glow-ambient hero-glow-indigo top-[-15%] left-[10%] w-[700px] h-[700px]" />
        <div className="glow-ambient hero-glow-violet top-[-5%] right-[10%] w-[650px] h-[650px]" />
      </div>

      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0A0A0F]/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5" />
            </div>
            <div className="text-base font-bold tracking-tight text-white flex items-center">
              <span>SupportDesk</span>
              <span className="ml-1 text-violet-400">AI</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#capabilities" className="hover:text-slate-100 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-100 transition-colors">
              How it works
            </a>
            <a href="#demo" className="hover:text-slate-100 transition-colors">
              Demo
            </a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-100 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/support"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium px-5 py-2 rounded-full shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium px-5 py-2 rounded-full shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Start free
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-7">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-violet-400 uppercase">
                  <span>AI SUPPORT AGENT</span>
                </div>

                {/* 3-line Headline with accent middle line */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                  Customer support,
                  <span className="block text-violet-400 my-1">
                    resolved by AI
                  </span>
                  before coffee's cold.
                </h1>

                {/* Subtext */}
                <p className="max-w-xl text-slate-400 text-base sm:text-lg leading-relaxed">
                  SupportDesk AI plugs into your helpdesk, learns your product in minutes,
                  and resolves tier-one tickets on its own — escalating to your team only
                  when a human genuinely matters.
                </p>

                {/* Dual CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={handleLogin}
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Start free trial</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 bg-transparent hover:bg-slate-900/60 text-slate-200 border border-slate-800 text-sm font-medium px-6 py-3 rounded-full transition-all hover:border-slate-700 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current text-slate-300" />
                    <span>Watch it work</span>
                  </a>
                </div>
              </div>

              {/* Right Hero Chat Visual */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <HeroChatDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TRUST BAR                                                                */}
        {/* ========================================================================= */}
        <section className="py-12 border-y border-slate-800/60 bg-[#07090E]/60 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 text-center space-y-6">
            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              TRUSTED BY SUPPORT TEAMS AT
            </div>

            {/* Auto-scrolling logo marquee */}
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="animate-marquee flex items-center gap-14 py-2">
                {[...trustLogos, ...trustLogos, ...trustLogos].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 text-slate-500 hover:text-slate-300 transition-colors opacity-70 hover:opacity-100 whitespace-nowrap cursor-default"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-base font-semibold tracking-tight">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 01 — CAPABILITIES                                                         */}
        {/* ========================================================================= */}
        <section id="capabilities" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            
            {/* Section Header */}
            <div className="max-w-3xl space-y-4">
              <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                01 — CAPABILITIES
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                One agent. The whole front line.
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Everything a tier-one support team does, handled autonomously — with
                your humans kept exactly where they're valuable.
              </p>
            </div>

            {/* Asymmetric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Row 1: Left Flagship Card with subtle violet glow ring */}
              <div className="md:col-span-7 rounded-3xl border border-violet-500/50 bg-[#0D111C]/90 p-8 shadow-[0_0_35px_rgba(139,92,246,0.12)] hover:border-violet-500/80 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="inline-flex p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-6">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Instant resolution
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                    Aria resolves tier-one tickets end to end — order lookups, refunds,
                    password resets — in under 30 seconds, no queue, no hold music.
                  </p>
                </div>
              </div>

              {/* Row 1: Right Card */}
              <div className="md:col-span-5 rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="inline-flex p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-6">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Omnichannel inbox
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Email, live chat, WhatsApp and Slack — one brain, every channel,
                    consistent answers.
                  </p>
                </div>
              </div>

              {/* Row 2: 3 narrower cards */}
              <div className="md:col-span-4 rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="inline-flex p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-6">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    Human handoff
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Escalates to your team with full context, sentiment and a drafted
                    reply. Zero re-explaining.
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="inline-flex p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-6">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    Knowledge sync
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Point it at your docs, help center and past tickets. Trained and
                    live in minutes, not sprints.
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="inline-flex p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-6">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    Resolution analytics
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Deflection rate, CSAT, cost per resolution — see exactly what the
                    agent saves you, weekly.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 02 — HOW IT WORKS                                                         */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-24 sm:py-32 border-t border-slate-800/50 bg-[#080B12]/50">
          <div className="mx-auto max-w-7xl px-6 space-y-16">
            
            {/* Header */}
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                02 — HOW IT WORKS
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Live in an afternoon.
              </h2>
            </div>

            {/* Horizontal Timeline graphic with animated line */}
            <div className="relative pt-6">
              {/* Connecting Line */}
              <div className="absolute top-[28px] left-[6%] right-[6%] h-[2px] bg-slate-800">
                <div
                  className="h-full bg-violet-500 transition-all duration-700 ease-out"
                  style={{
                    width: timelineStep === 0 ? "25%" : timelineStep === 1 ? "60%" : "100%"
                  }}
                />
              </div>

              {/* 3 Circular Icon Nodes */}
              <div className="relative z-10 flex justify-between">
                
                {/* Node 1 */}
                <div
                  onClick={() => setTimelineStep(0)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      timelineStep >= 0
                        ? "bg-[#0A0A0F] border-2 border-violet-500 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                        : "bg-slate-900 border-2 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Plug className="h-6 w-6" />
                  </div>
                </div>

                {/* Node 2 */}
                <div
                  onClick={() => setTimelineStep(1)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      timelineStep >= 1
                        ? "bg-[#0A0A0F] border-2 border-violet-500 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                        : "bg-slate-900 border-2 border-slate-800 text-slate-500"
                    }`}
                  >
                    <GraduationCap className="h-6 w-6" />
                  </div>
                </div>

                {/* Node 3 */}
                <div
                  onClick={() => setTimelineStep(2)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      timelineStep >= 2
                        ? "bg-[#0A0A0F] border-2 border-violet-500 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                        : "bg-slate-900 border-2 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Rocket className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* 3 Step Details Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-semibold tracking-wider text-slate-500">
                    STEP 01
                  </div>
                  <h3 className="text-xl font-bold text-white">Connect</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Plug SupportDesk into your helpdesk and channels. One-click OAuth
                    for Zendesk, Intercom, Gmail and Slack — no migration, no downtime.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-semibold tracking-wider text-slate-500">
                    STEP 02
                  </div>
                  <h3 className="text-xl font-bold text-white">Train</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Aria ingests your help center, docs and past conversations, then
                    mirrors your tone of voice. Review suggested answers before go-live.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-semibold tracking-wider text-slate-500">
                    STEP 03
                  </div>
                  <h3 className="text-xl font-bold text-white">Resolve</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Flip the switch. The agent answers instantly across every channel,
                    and escalates the rare edge cases to humans with full context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 03 — LIVE DEMO (INTERACTIVE SANDBOX)                                      */}
        {/* ========================================================================= */}
        <section id="demo" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <InteractiveSandbox />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 04 — PRICING                                                              */}
        {/* ========================================================================= */}
        <section id="pricing" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 space-y-16">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                04 — PRICING
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Cheaper than one support hire.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                14-day free trial on every plan. No credit card, no sales call required.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* Starter Card */}
              <div className="rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 flex flex-col justify-between transition-all hover:border-slate-700">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Starter</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      For small teams drowning in repetitive tickets.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$49</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 pt-2">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>1,000 AI resolutions / mo</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>2 channels (email + chat)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Knowledge base sync</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Basic analytics</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleLogin}
                    className="w-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-medium py-3 rounded-full transition-all cursor-pointer"
                  >
                    Start free trial
                  </button>
                </div>
              </div>

              {/* Growth Card (Highlighted Flagship) */}
              <div className="relative rounded-3xl border-2 border-violet-500/80 bg-[#0D111E]/95 p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(139,92,246,0.2)] transition-all transform lg:-translate-y-2">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                  MOST POPULAR
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Growth</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      For scaling teams that want the front line automated.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$149</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200 pt-2">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>10,000 AI resolutions / mo</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Unlimited channels</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Human handoff with context</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Resolution analytics + CSAT</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleLogin}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-3 rounded-full shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Start free trial
                  </button>
                </div>
              </div>

              {/* Enterprise Card */}
              <div className="rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 p-8 flex flex-col justify-between transition-all hover:border-slate-700">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Enterprise</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      For organizations with compliance and scale needs.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">Custom</span>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 pt-2">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Unlimited resolutions</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>SSO / SAML + audit logs</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>Custom SLA + dedicated CSM</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      <span>PII redaction & data residency</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleLogin}
                    className="w-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-medium py-3 rounded-full transition-all cursor-pointer"
                  >
                    Talk to sales
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 06 — SOCIAL PROOF                                                         */}
        {/* ========================================================================= */}
        <section className="py-24 sm:py-32 border-t border-slate-800/50 bg-[#080B12]/50">
          <div className="mx-auto max-w-7xl px-6">
            <TestimonialCarousel />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 05 — FAQ                                                                  */}
        {/* ========================================================================= */}
        <section id="faq" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Column: Heading & Human Link */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                  05 — FAQ
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Asked, answered.
                </h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed pt-2">
                  Still curious?{" "}
                  <button
                    onClick={handleLogin}
                    className="text-violet-400 hover:text-violet-300 underline font-medium transition cursor-pointer"
                  >
                    Talk to a human
                  </button>{" "}
                  — we keep a few around.
                </p>
              </div>

              {/* Right Column: Numbered Accordion */}
              <div className="lg:col-span-7 space-y-3">
                {faqs.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  const numStr = String(index + 1).padStart(2, "0");
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/90 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-900/40 cursor-pointer"
                      >
                        <div className="flex items-center gap-4 pr-4">
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            {numStr}
                          </span>
                          <span className="text-sm sm:text-base font-semibold text-slate-100">
                            {faq.q}
                          </span>
                        </div>
                        <div
                          className={`h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ${
                            isOpen ? "rotate-180 text-violet-400" : ""
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/40">
                          <div className="pl-8">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 06 — FINAL CTA                                                            */}
        {/* ========================================================================= */}
        <section className="py-28 sm:py-36 border-t border-slate-800/60 bg-gradient-to-b from-[#0A0A0F] via-[#0D101C] to-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

          <div className="mx-auto max-w-4xl px-6 text-center space-y-7 relative z-10">
            <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
              06 — GET STARTED
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Let's talk — or rather,
              <span className="block text-violet-400 mt-1">let Aria do it.</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Your next 1,000 tickets could resolve themselves.
              <br />
              Fourteen days free, live this afternoon.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-7 py-3.5 rounded-full shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 hover:scale-[1.02] cursor-pointer"
              >
                <span>Start free trial</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#demo"
                className="inline-flex items-center gap-2 bg-transparent hover:bg-slate-900 text-slate-200 border border-slate-800 text-sm font-medium px-7 py-3.5 rounded-full transition-all hover:border-slate-700 cursor-pointer"
              >
                <span>Book a demo</span>
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER                                                                    */}
        {/* ========================================================================= */}
        <footer className="border-t border-slate-800/80 bg-[#06080D] pt-16 pb-12">
          <div className="mx-auto max-w-7xl px-6 space-y-14">
            
            {/* Top row 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              
              {/* Left Brand Col */}
              <div className="md:col-span-4 space-y-4">
                <Link to="/" className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-md">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="text-base font-bold tracking-tight text-white flex items-center">
                    <span>SupportDesk</span>
                    <span className="ml-1 text-violet-400">AI</span>
                  </div>
                </Link>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  The AI support agent that resolves tickets in seconds, on every
                  channel, around the clock.
                </p>
              </div>

              {/* Col 1: Product */}
              <div className="md:col-span-2 sm:col-span-4 space-y-3.5">
                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  PRODUCT
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li><a href="#capabilities" className="hover:text-slate-200 transition">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-slate-200 transition">How it works</a></li>
                  <li><a href="#pricing" className="hover:text-slate-200 transition">Pricing</a></li>
                  <li><a href="#faq" className="hover:text-slate-200 transition">FAQ</a></li>
                </ul>
              </div>

              {/* Col 2: Company */}
              <div className="md:col-span-3 sm:col-span-4 space-y-3.5">
                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  COMPANY
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li><a href="#" className="hover:text-slate-200 transition">About</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Careers</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Blog</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Press kit</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Contact</a></li>
                </ul>
              </div>

              {/* Col 3: Resources */}
              <div className="md:col-span-3 sm:col-span-4 space-y-3.5">
                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  RESOURCES
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li><a href="#" className="hover:text-slate-200 transition">Documentation</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">API reference</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Status</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Security</a></li>
                  <li><a href="#" className="hover:text-slate-200 transition">Privacy</a></li>
                </ul>
              </div>

            </div>

            {/* Bottom Row */}
            <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
              <div>© 2026 SUPPORTDESK AI, INC.</div>
              <div>BUILT FOR SUPPORT TEAMS WHO'D RATHER BE BUILDING</div>
            </div>

          </div>
        </footer>

        {/* In-App Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />

      </main>
    </div>
  );
}
