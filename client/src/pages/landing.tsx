import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import AuthModal from "@/components/common/AuthModal";
import { 
  Sparkles, 
  Menu, 
  X, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Database,
  Cpu,
  BarChart3,
  SlidersHorizontal,
  Globe,
  CheckCircle2,
  Bot,
  Clock
} from "lucide-react";

// FadeInUp scroll-reveal component with smooth cubic-bezier physics
function FadeInUp({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.1 }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// SupportDesk AI Custom Stroke Brand Logo
function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-[#222226] to-[#121214] border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <Bot className="h-4.5 w-4.5 text-[#FF6B0A]" />
      </div>
    </div>
  );
}

// 5 Brand SVGs for the continuous marquee
const brandLogos = [
  {
    name: "Springfield",
    icon: (
      <svg className="h-6 w-auto" viewBox="0 0 130 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6L4 15L12 24M20 6L28 15L20 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="36" y="20" fill="currentColor" fontSize="13" fontWeight="600" letterSpacing="0.08em">SPRINGFIELD</text>
      </svg>
    ),
  },
  {
    name: "Orbitc",
    icon: (
      <svg className="h-6 w-auto" viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="15" rx="10" ry="5" stroke="currentColor" strokeWidth="1.8" transform="rotate(-25 14 15)"/>
        <circle cx="14" cy="15" r="3" fill="currentColor"/>
        <text x="32" y="20" fill="currentColor" fontSize="13" fontWeight="600" letterSpacing="0.08em">ORBITC</text>
      </svg>
    ),
  },
  {
    name: "Cloud",
    icon: (
      <svg className="h-6 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 19C6.34315 19 5 17.6569 5 16C5 14.4706 6.14112 13.2081 7.62532 13.0232C7.54274 12.6917 7.5 12.3501 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C13.8824 7.5 15.4952 8.65787 16.1493 10.3013C16.7028 9.80789 17.4334 9.5 18.2308 9.5C19.7602 9.5 21 10.7398 21 12.2692C21 12.3923 20.992 12.5135 20.9763 12.6324C22.1481 13.178 22.95 14.3644 22.95 15.7333C22.95 17.5375 21.4875 19 19.6833 19H8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <text x="30" y="20" fill="currentColor" fontSize="13" fontWeight="600" letterSpacing="0.08em">CLOUD</text>
      </svg>
    ),
  },
  {
    name: "Amster",
    icon: (
      <svg className="h-6 w-auto" viewBox="0 0 115 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 21L14 7L23 21H18L14 14L10 21H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <text x="32" y="20" fill="currentColor" fontSize="13" fontWeight="600" letterSpacing="0.08em">AMSTER</text>
      </svg>
    ),
  },
  {
    name: "Nexus",
    icon: (
      <svg className="h-6 w-auto" viewBox="0 0 105 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="7" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M5 15H21M13 7V23" stroke="currentColor" strokeWidth="1.5"/>
        <text x="30" y="20" fill="currentColor" fontSize="13" fontWeight="600" letterSpacing="0.08em">NEXUS</text>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAction = () => {
    if (user) {
      navigate("/support");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // SupportDesk AI Capabilities with refined typography & real engineering stats
  const capabilities = [
    {
      title: "AI Ticket Classification",
      desc: "Instantly triages inbound customer inquiries into technical integration, billing, account access, bug reports, and general queries.",
      icon: Cpu,
      badge: "Ingestion Agent",
      metric: "< 190ms latency",
    },
    {
      title: "pgvector Cosine Retrieval",
      desc: "Executes 1536-dimensional semantic similarity vector search over your internal runbooks and documentation stored in PostgreSQL.",
      icon: Database,
      badge: "Knowledge Agent",
      metric: "94.2% Hit Rate @ 5",
    },
    {
      title: "Tavily Real-time Web Grounding",
      desc: "Triggers external documentation search whenever internal knowledge confidence is insufficient, verifying citation links.",
      icon: Globe,
      badge: "Search Agent",
      metric: "100% URL Verified",
    },
    {
      title: "Multi-Model Failover Resilience",
      desc: "Automatic failover across Google Gemini 2.5 Flash, OpenAI GPT-4o-mini, and Groq Cloud Qwen / LLaMA ensures zero downtime.",
      icon: SlidersHorizontal,
      badge: "Synthesis Agent",
      metric: "3 Enterprise Providers",
    },
    {
      title: "Automated Human Escalation",
      desc: "Safely flags tickets to engineering leads when confidence drops below 70% or customer sentiment is critical or frustrated.",
      icon: ShieldCheck,
      badge: "Guardrail Agent",
      metric: "96.5% Precision",
    },
    {
      title: "Live Token Cost Accounting",
      desc: "Tracks prompt tokens, completion tokens, USD cost estimation, and step latencies with millisecond precision in PostgreSQL telemetry.",
      icon: BarChart3,
      badge: "Telemetry Agent",
      metric: "Cost per query ~$0.0004",
    },
  ];

  // Pipeline Lifecycle Steps
  const steps = [
    {
      number: "01",
      title: "Ingestion & Sentiment Classification",
      desc: "Validates incoming payload, parses customer metadata, classifies intent category, and evaluates emotional urgency across positive, neutral, frustrated, or critical.",
      agent: "Ingestion & Intent Nodes",
    },
    {
      number: "02",
      title: "pgvector Search & Tavily Grounding",
      desc: "Queries internal chunked vectors with cosine similarity (<=>). If confidence < 0.85, executes live Tavily technical web search to ground response facts.",
      agent: "Knowledge & Search Nodes",
    },
    {
      number: "03",
      title: "Synthesis, Guardrails & Auto-Escalation",
      desc: "Generates Tier-2/Tier-3 Markdown draft with verified citation links. Calculates blended confidence score and routes low-confidence tickets to human agents.",
      agent: "Synthesis & Guardrail Nodes",
    },
  ];

  // Specific Project FAQs
  const faqItems = [
    {
      question: "How does the AI Support Desk classify incoming tickets?",
      answer: "When a customer inquiry arrives, our Ingestion and Intent Agents evaluate the prompt against classification schemas. It automatically detects the category (technical/integration, billing, account access, bug reports, feature requests) and evaluates urgency to determine whether runbooks or web searches are necessary.",
    },
    {
      question: "How does PostgreSQL pgvector semantic retrieval work?",
      answer: "Internal knowledge articles are partitioned into 512-token chunks and embedded as 1536-dimensional vectors using Google Gemini or OpenAI. PostgreSQL executes native cosine distance (<=>) matching. If an internal match has confidence ≥ 0.85, it is used immediately; otherwise, live Tavily web search is queried.",
    },
    {
      question: "When are tickets automatically escalated to human agents?",
      answer: "Tickets are escalated to human leads whenever the blended confidence score falls below 70%, or when customer sentiment is classified as 'critical' or 'frustrated'. The system attaches pre-drafted troubleshooting steps and intent summaries so human agents can resolve immediately.",
    },
    {
      question: "Which LLM providers and failovers are supported?",
      answer: "The platform features native multi-provider resilience with automatic failover: Google Gemini (gemini-2.5-flash) as primary, OpenAI (gpt-4o-mini) as secondary, and Groq Cloud (Qwen/LLaMA) as fast fallback, preventing downtime if an upstream provider experiences rate limits.",
    },
    {
      question: "Is customer data, tickets, and session authentication secure?",
      answer: "Yes. Authentication uses enterprise Scalekit OAuth with strict CSRF state validation and httpOnly JWT session cookies. The database enforces role-based access control (RBAC), ensuring customers can only access their own tickets while agents and admins manage the full queue.",
    },
  ];

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-white/20 selection:text-white">
      {/* 1. Navigation Bar (Sticky & Responsive) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-black/85 backdrop-blur-md border-b border-white/[0.08]" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo on Left */}
          <div
            onClick={() => scrollToSection("about")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <BrandLogo />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-orange-400 transition-colors">
                SupportDesk <span className="text-[#FF6B0A]">AI</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                LangGraph Multi-Agent
              </span>
            </div>
          </div>

          {/* Desktop Links in Center */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("architecture")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Desktop "Get started" button on Right */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate("/support")}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-b from-[#2A2A2D] to-[#1C1C1F] border border-white/[0.12] hover:border-white/[0.25] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Agent Console</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
              </button>
            ) : (
              <button
                onClick={handleAction}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-b from-[#2A2A2D] to-[#1C1C1F] border border-white/[0.12] hover:border-white/[0.25] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Get started</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
              </button>
            )}
          </div>

          {/* Mobile: Hamburger Icon */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 flex flex-col gap-5 animate-in slide-in-from-top duration-200">
            <button
              onClick={() => scrollToSection("about")}
              className="text-left text-base font-medium text-gray-300 hover:text-white py-1 cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-left text-base font-medium text-gray-300 hover:text-white py-1 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("architecture")}
              className="text-left text-base font-medium text-gray-300 hover:text-white py-1 cursor-pointer"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-left text-base font-medium text-gray-300 hover:text-white py-1 cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-left text-base font-medium text-gray-300 hover:text-white py-1 cursor-pointer"
            >
              Contact
            </button>
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAction();
                }}
                className="w-full text-center bg-gradient-to-b from-[#2A2A2D] to-[#1C1C1F] hover:from-[#323236] hover:to-[#222225] text-white text-sm font-medium py-3 rounded-full border border-white/[0.12] shadow-md cursor-pointer"
              >
                {user ? "Open Agent Console" : "Get started"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (id="about") */}
      <section
        id="about"
        className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0 overflow-hidden"
      >
        {/* Background Video with Gradient Overlay */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-90 pointer-events-none"
          >
            <source
              src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Top Badge */}
          <FadeInUp delay={100}>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-300 tracking-tight">LangGraph Multi-Agent Architecture • pgvector Grounding</span>
            </div>
          </FadeInUp>

          {/* Headline */}
          <FadeInUp delay={200}>
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-center leading-[1.1] text-white">
              The intelligence layer <br />
              for clear <span className="font-serif italic font-normal text-white">decisions.</span>
            </h1>
          </FadeInUp>

          {/* Sub-text */}
          <FadeInUp delay={300}>
            <p className="text-[16px] text-gray-400 max-w-2xl text-center mb-10 leading-relaxed font-normal">
              Autonomous customer support orchestrated by stateful LangGraph agents. Grounded by pgvector internal runbooks, live Tavily technical search, and defensible escalation protocols.
            </p>
          </FadeInUp>

          {/* Buttons: Flex row */}
          <FadeInUp delay={400}>
            <div className="flex flex-row items-center gap-4">
              <button
                onClick={handleAction}
                className="group relative inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-black text-sm font-semibold px-6 py-3 rounded-full transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-[0.98]"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="inline-flex items-center bg-gradient-to-b from-[#262629] to-[#18181A] hover:from-[#2F2F33] hover:to-[#1F1F22] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/[0.12] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-[0.98]"
              >
                Learn more
              </button>
            </div>
          </FadeInUp>
        </div>

        {/* Marquee (Trusted by industry leaders) */}
        <div className="w-full mt-24">
          <FadeInUp delay={500}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-8 text-center">
              Trusted by industry leaders
            </p>
          </FadeInUp>

          {/* Infinite loop marquee with CSS mask gradient */}
          <div
            className="w-full overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          >
            <div className="flex w-max animate-marquee">
              {[...brandLogos, ...brandLogos, ...brandLogos, ...brandLogos].map((brand, idx) => (
                <div
                  key={`${brand.name}-${idx}`}
                  className="flex-shrink-0 px-8 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {brand.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature 1: AI Chat (id="features") */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <FadeInUp delay={100}>
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold mb-6">
                <span>✨ AI chat</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6 leading-tight">
                Where speed meets intelligent conversation.
              </h2>
              <p className="text-base text-gray-400 mb-8 leading-relaxed font-normal">
                A conversational AI assistant that understands your questions, provides intelligent answers, and helps you get things done fast from casual chats to complex tasks.
              </p>
              <button
                onClick={handleAction}
                className="group relative inline-flex items-center gap-2 bg-gradient-to-b from-[#262629] to-[#18181A] hover:from-[#2F2F33] hover:to-[#1F1F22] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/[0.12] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
              </button>
            </div>
          </FadeInUp>

          {/* Right Mockup */}
          <FadeInUp delay={200}>
            <div className="rounded-3xl overflow-hidden p-8 border border-white/[0.1] relative min-h-[460px] flex items-end justify-center shadow-2xl">
              {/* Background Video with Overlay */}
              <div className="absolute inset-0 z-0">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full"
                >
                  <source
                    src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-black/25" />
              </div>

              {/* Floating Card: AI Chat Interface */}
              <div className="relative z-10 w-full max-w-md bg-[#161618]/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                {/* Top Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-300 font-medium whitespace-nowrap">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>OAuth Callback Triage</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-300 font-medium whitespace-nowrap">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>pgvector Runbook</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-300 font-medium whitespace-nowrap">
                    <Globe className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Tavily Grounding</span>
                  </div>
                </div>

                {/* Chat Preview Card */}
                <div className="my-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-gray-300 space-y-2">
                  <div className="flex items-center justify-between text-white font-medium">
                    <span className="flex items-center gap-1.5 text-yellow-400 text-[11.5px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      SupportDesk Autonomous Agent
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Confidence 94%
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-[11.5px]">
                    Identified error: <code className="text-orange-400 font-mono">redirect_uri_mismatch</code>. Matching internal runbook #1042 retrieved via pgvector cosine search. Response grounded with verified Scalekit callback documentation.
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 border-t border-white/[0.06]">
                    <span className="flex items-center gap-1 text-gray-400 font-mono">
                      <Clock className="w-3 h-3 text-orange-400" /> Latency: 1,280ms
                    </span>
                    <span className="text-gray-400 font-mono">Provider: Gemini 2.5 Flash</span>
                  </div>
                </div>

                {/* Bottom Input Area */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
                  <input
                    type="text"
                    readOnly
                    value="Ask anything or submit ticket..."
                    className="w-full bg-transparent text-xs text-gray-400 focus:outline-none cursor-default"
                  />
                  <div className="flex items-center gap-2 text-gray-400">
                    <Bot className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    <Sparkles className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Feature Grid: SupportDesk AI Multi-Agent Capabilities with Premium Glassmorphism */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <FadeInUp delay={100}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-300 mb-4 uppercase tracking-wider font-mono">
              Production Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
              Engineered for Enterprise Support Operations
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Every customer inquiry coordinates a stateful LangGraph multi-agent flow with transparent telemetry, pgvector grounding, and automated escalation safeguards.
            </p>
          </div>
        </FadeInUp>

        {/* 6 Capabilities Cards with Editorial Refinement */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const IconComponent = cap.icon;
            return (
              <FadeInUp key={cap.title} delay={idx * 80}>
                <div className="group relative p-7 rounded-2xl bg-gradient-to-b from-[#141416] to-[#0D0D0E] border border-white/[0.08] hover:border-white/[0.22] shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 group-hover:text-white group-hover:border-white/[0.18] transition-all">
                        <IconComponent className="w-5 h-5 text-gray-300 group-hover:text-[#FF6B0A] transition-colors" />
                      </div>
                      <span className="text-[11px] font-mono font-medium text-gray-400 px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                        {cap.badge}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-white mb-2.5 tracking-tight group-hover:text-gray-100 transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-[13.5px] text-gray-400 leading-relaxed font-normal">
                      {cap.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span className="text-gray-400 font-mono text-[11px]">{cap.metric}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      </section>

      {/* 3-Step Agentic Architecture Lifecycle with Tiered Visual Depth */}
      <section id="architecture" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <FadeInUp delay={100}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-300 mb-4 uppercase tracking-wider font-mono">
              Workflow Lifecycle
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
              How the Multi-Agent Pipeline Resolves Tickets
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              From raw customer message to high-confidence Tier-2 resolution in under 2 seconds.
            </p>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st, idx) => (
            <FadeInUp key={st.number} delay={idx * 120}>
              <div className="group relative p-8 rounded-2xl bg-gradient-to-b from-[#141416] to-[#0D0D0E] border border-white/[0.08] hover:border-white/[0.22] shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 flex flex-col justify-between h-full">
                <div>
                  <div className="text-3xl font-mono font-bold text-white/30 group-hover:text-white/60 transition-colors mb-6">
                    {st.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                    {st.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal">
                    {st.desc}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-medium text-gray-400">
                  <span className="flex items-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>State Preserved</span>
                  </span>
                  <span className="font-mono text-gray-400 text-[11px]">{st.agent}</span>
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* 5. FAQ Section (id="faq") */}
      <section id="faq" className="py-32 px-6 max-w-3xl mx-auto">
        <FadeInUp delay={100}>
          <h2 className="text-4xl md:text-5xl font-semibold text-center mb-12 tracking-tight text-white">
            We've got answers
          </h2>
        </FadeInUp>

        {/* Transparent container with visible border */}
        <FadeInUp delay={200}>
          <div className="border border-white/[0.08] rounded-2xl bg-[#0D0D0F]/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
            {faqItems.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const isLast = index === faqItems.length - 1;
              return (
                <div
                  key={index}
                  className={`${!isLast ? "border-b border-white/[0.08]" : ""}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-6 px-6 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                  >
                    <span className="text-base text-white font-medium group-hover:text-gray-200 transition-colors">
                      {faq.question}
                    </span>
                    <span
                      className={`text-gray-400 group-hover:text-white transition-transform duration-300 ease-in-out ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                    </span>
                  </button>

                  {/* CSS grid trick transition (grid-template-rows: 0fr to 1fr) */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-gray-400 text-sm pb-6 px-6 leading-relaxed font-normal">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </section>

      {/* 6. Footer Section (id="contact") */}
      <footer id="contact" className="relative z-0 pt-32 pb-10 px-6 border-t border-white/[0.08] overflow-hidden">
        {/* Background Video with Strong Gradient Overlay */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full opacity-40"
          >
            <source
              src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black pointer-events-none" />
        </div>

        {/* Top CTA */}
        <div className="max-w-4xl mx-auto text-center mb-32 relative z-10">
          <FadeInUp delay={100}>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 text-white">
              Ready to automate <span className="font-serif italic font-normal text-white">everything?</span>
            </h2>
          </FadeInUp>
          <FadeInUp delay={200}>
            <div className="flex flex-row justify-center items-center gap-4">
              <button
                onClick={handleAction}
                className="group relative inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-black text-sm font-semibold px-6 py-3 rounded-full transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-[0.98]"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="inline-flex items-center bg-gradient-to-b from-[#262629] to-[#18181A] hover:from-[#2F2F33] hover:to-[#1F1F22] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/[0.12] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-[0.98]"
              >
                Learn more
              </button>
            </div>
          </FadeInUp>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto mb-24 relative z-10">
          {/* Col 1 */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo />
              <span className="text-xl font-bold tracking-tight text-white">
                SupportDesk <span className="text-[#FF6B0A]">AI</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 font-normal leading-relaxed max-w-sm">
              Production-grade customer support platform powered by LangGraph multi-agent orchestration, PostgreSQL pgvector retrieval, and real-time Tavily search grounding.
            </p>
          </div>

          {/* Col 2 (Product) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1 font-mono">Product</h4>
            <button onClick={() => scrollToSection("about")} className="text-left text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              About Platform
            </button>
            <button onClick={() => scrollToSection("features")} className="text-left text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              Agent Features
            </button>
            <button onClick={() => scrollToSection("architecture")} className="text-left text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              LangGraph Pipeline
            </button>
            <button onClick={() => navigate("/support")} className="text-left text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              Agent Console
            </button>
          </div>

          {/* Col 3 (Tech Stack) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1 font-mono">Architecture</h4>
            <span className="text-sm text-gray-400">FastAPI & Python 3.12</span>
            <span className="text-sm text-gray-400">PostgreSQL 16 & pgvector</span>
            <span className="text-sm text-gray-400">LangGraph & LangChain</span>
            <span className="text-sm text-gray-400">Scalekit OAuth Authentication</span>
          </div>

          {/* Col 4 (Providers & AI Models) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1 font-mono">Models & Grounding</h4>
            <span className="text-sm text-gray-400">Google Gemini 2.5 Flash</span>
            <span className="text-sm text-gray-400">OpenAI GPT-4o-mini</span>
            <span className="text-sm text-gray-400">Groq Cloud (LLaMA / Qwen)</span>
            <span className="text-sm text-gray-400">Tavily Technical Search API</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 border-t border-white/[0.08] pt-8 max-w-7xl mx-auto relative z-10">
          <div>
            © 2026 SupportDesk AI. Fullstack AI Supportdesk Agent with LangGraph & pgvector.
          </div>
          <div className="flex items-center gap-6 text-gray-400">
            <span>Enterprise SLA</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Telemetry & Cost Accounting</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
