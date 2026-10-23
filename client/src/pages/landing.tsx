import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { 
  Bot, 
  ArrowRight, 
  Play, 
  Check, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  Database, 
  Cpu, 
  BarChart3, 
  FileText, 
  Layers, 
  SlidersHorizontal,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroChatDemo from "@/components/landing/HeroChatDemo";
import InteractiveSandbox from "@/components/landing/InteractiveSandbox";
import AuthModal from "@/components/common/AuthModal";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleAction = () => {
    if (user) {
      navigate("/support");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const capabilities = [
    {
      title: "AI Ticket Classification",
      description: "Automatically analyzes incoming inquiries into technical, billing, access, and bug categories.",
      icon: Cpu,
    },
    {
      title: "Knowledge-Assisted Replies",
      description: "Retrieves internal runbooks and documentation using cosine vector relevance matching.",
      icon: Database,
    },
    {
      title: "Human Review & Escalation",
      description: "Routes sensitive or uncertain queries with complete context and suggested actions.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Provider AI Engine",
      description: "Switch seamlessly between Google Gemini, Groq (LLaMA), and OpenAI GPT models.",
      icon: SlidersHorizontal,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Review incoming ticket",
      desc: "Tickets arrive from your customer touchpoints. The system classifies the issue type, evaluates customer sentiment, and checks internal runbooks.",
    },
    {
      number: "02",
      title: "Retrieve sources & generate reply",
      desc: "Relevant internal knowledge articles and live documentation are retrieved. The agent drafts a context-grounded response with transparent confidence scoring.",
    },
    {
      number: "03",
      title: "Review, respond, or escalate",
      desc: "Your support operator reviews the suggested reply in the dashboard. Approve with one click, edit the draft, or escalate to engineering.",
    },
  ];

  const features = [
    {
      title: "AI Ticket Classification",
      desc: "Triages inbound inquiries into billing, technical, account access, bug reports, and general queries so issues reach the right resolution path immediately.",
      icon: Cpu,
    },
    {
      title: "Sentiment & Urgency Detection",
      desc: "Tracks customer emotion across positive, neutral, frustrated, and critical states to prioritize urgent customer roadblocks before they escalate.",
      icon: Clock,
    },
    {
      title: "Knowledge-Base Management",
      desc: "Store and manage FAQs, product documentation, troubleshooting guides, and internal runbooks directly in the workspace.",
      icon: FileText,
    },
    {
      title: "Tavily Web Search & References",
      desc: "Performs real-time search queries across developer documentation and returns traceable, clickable source citations when internal docs are insufficient.",
      icon: Globe,
    },
    {
      title: "AI-Generated Reply Drafts",
      desc: "Synthesizes clear, polite, and grounded response proposals tailored to the specific context of the customer's problem.",
      icon: Sparkles,
    },
    {
      title: "Confidence & Retrieval Scoring",
      desc: "Calculates a blended confidence index combining retrieval relevance match and model assessment, with clear breakdown logs.",
      icon: Layers,
    },
    {
      title: "Human Escalation Recommendations",
      desc: "Automatically suggests escalation when confidence is low or sentiment is critical, providing recommended responses and triage steps.",
      icon: ShieldCheck,
    },
    {
      title: "Support Operations Analytics",
      desc: "Monitors ticket resolution volume, auto-close rate, escalation counts, top issue categories, and 7-day resolution trends.",
      icon: BarChart3,
    },
    {
      title: "Multi-Provider Sandbox",
      desc: "Simulate queries against Gemini 1.5 Flash, Groq LLaMA 3.3 70B, or OpenAI GPT-4o-mini with real-time latency and token tracking.",
      icon: SlidersHorizontal,
    },
  ];

  const faqs = [
    {
      q: "How does AI ticket classification work?",
      a: "When a ticket arrives, the classification engine analyzes the inquiry text against domain patterns and model prompts to categorize it into billing, technical integration, account access, bug reports, feature requests, or general inquiries. It also determines if external technical documentation is needed."
    },
    {
      q: "How does source retrieval work?",
      a: "The assistant performs a cosine vector similarity search against your internal knowledge base articles. If the issue requires current external technical specifications (such as SDK protocols or API parameters), it queries Tavily Search and grounds the answer exclusively in the returned sources."
    },
    {
      q: "What happens when the model is uncertain?",
      a: "When the blended confidence score falls below 70% or customer sentiment is evaluated as critical or frustrated, the ticket is flagged as 'Escalated'. The copilot generates a preliminary draft, provides specific recommended action items for your team, and awaits human approval."
    },
    {
      q: "Which AI providers are supported?",
      a: "The platform supports Google Gemini (gemini-1.5-flash), Groq-hosted open-weights models (llama-3.3-70b-versatile), and OpenAI (gpt-4o-mini). Providers are configured securely server-side, and an automated fallback activates if your primary provider encounters rate limits."
    },
    {
      q: "How is the knowledge base managed?",
      a: "You can create, edit, categorize, and delete articles directly inside the authenticated dashboard. Articles are organized into FAQ, Product Documentation, Internal Runbooks, and Troubleshooting Guides, and are indexed immediately for retrieval."
    },
    {
      q: "What happens when a provider is unavailable?",
      a: "If your primary AI provider experiences downtime or a network timeout, the orchestration pipeline automatically falls back to an alternative configured secondary provider (such as Groq LLaMA) and records the fallback event in the diagnostic telemetry log."
    },
    {
      q: "How is customer information protected?",
      a: "All credentials and API keys remain strictly on the server and are never exposed in browser bundles. Protected routes require verified session cookies, external links are validated for safe URL schemes, and destructive operations require human confirmation."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1916] font-sans selection:bg-[#FFF0E4] selection:text-[#1C1916]">
      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#E7DFD5] bg-[#FFFDFA]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C1916] text-[#FF6B0A] shadow-xs transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5" />
            </div>
            <div className="text-base font-bold tracking-tight text-[#1C1916] flex items-center">
              <span>SupportDesk</span>
              <span className="ml-1 text-[#FF6B0A]">AI</span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#6D665F]">
            <a href="#features" className="hover:text-[#1C1916] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1C1916] transition-colors">How it works</a>
            <a href="#demo" className="hover:text-[#1C1916] transition-colors">Product demo</a>
            <a href="#security" className="hover:text-[#1C1916] transition-colors">Security</a>
            <a href="#faq" className="hover:text-[#1C1916] transition-colors">FAQ</a>
          </nav>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/support"
                className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] text-xs font-bold px-4 py-2 rounded-full shadow-xs transition-all"
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-xs font-semibold text-[#1C1916] hover:text-[#6D665F] px-3 py-2 cursor-pointer"
                >
                  Sign in
                </button>
                <Button
                  onClick={handleAction}
                  size="sm"
                  className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] text-xs font-bold px-4 py-2 rounded-full shadow-xs"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-[#E7DFD5] warm-dot-pattern">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Hero Content */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD8BF] bg-[#FFF0E4] px-3.5 py-1 text-xs font-semibold text-[#E85B00] tracking-wide uppercase">
                  <span>AI-POWERED CUSTOMER SUPPORT</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1C1916] leading-[1.12]">
                  Support your customers with more clarity.
                </h1>

                <p className="max-w-xl text-[#6D665F] text-base sm:text-lg leading-relaxed">
                  Resolve support requests faster with an AI assistant that classifies issues, finds relevant sources, drafts replies, and helps your team decide what needs a human.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={handleAction}
                    size="lg"
                    className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold px-6 py-3 rounded-full shadow-xs"
                  >
                    <span>Explore the workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 bg-[#FFFDFA] hover:bg-[#F0EBE3] text-[#1C1916] border border-[#E7DFD5] text-sm font-semibold px-6 py-3 rounded-full transition shadow-xs cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current text-[#FF6B0A]" />
                    <span>Interactive Triage Demo</span>
                  </a>
                </div>
              </div>

              {/* Right Hero Preview */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <HeroChatDemo />
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CAPABILITY STRIP                                                         */}
        {/* ========================================================================= */}
        <section className="py-12 bg-[#FFFDFA] border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((cap, idx) => {
                const IconComponent = cap.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-[#FFF0E4] border border-[#FFD8BF] text-[#FF6B0A] flex items-center justify-center">
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1C1916]">{cap.title}</h3>
                    <p className="text-xs text-[#6D665F] leading-relaxed">{cap.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW IT WORKS                                                             */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-20 sm:py-28 border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-7xl px-6 space-y-14">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#FF6B0A] uppercase">
                THREE-STEP WORKFLOW
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1916]">
                How the support copilot works.
              </h2>
              <p className="text-[#6D665F] text-sm sm:text-base leading-relaxed">
                A structured, transparent pipeline that assists your support team without unpredictable black-box behavior.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div key={idx} className="saas-card rounded-2xl p-7 space-y-4">
                  <div className="text-2xl font-black font-mono text-[#FF6B0A]">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1916]">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6D665F] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FEATURES GRID                                                            */}
        {/* ========================================================================= */}
        <section id="features" className="py-20 sm:py-28 bg-[#FFFDFA] border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-7xl px-6 space-y-14">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#FF6B0A] uppercase">
                ENGINEERED FOR TEAMS
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1916]">
                Everything you need to triage and resolve issues.
              </h2>
              <p className="text-[#6D665F] text-sm sm:text-base leading-relaxed">
                Explore the implemented capabilities built into the SupportDesk AI platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-[#E7DFD5] bg-[#F8F5F0] space-y-3 hover:border-[#D9CFBD] transition">
                    <div className="h-9 w-9 rounded-xl bg-[#FFFDFA] border border-[#E7DFD5] text-[#FF6B0A] flex items-center justify-center shadow-xs">
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-bold text-[#1C1916]">{feat.title}</h3>
                    <p className="text-xs text-[#6D665F] leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE DEMO                                                         */}
        {/* ========================================================================= */}
        <section id="demo" className="py-20 sm:py-28 border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-7xl px-6">
            <InteractiveSandbox />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECURITY & DATA PROTECTION                                               */}
        {/* ========================================================================= */}
        <section id="security" className="py-20 sm:py-28 bg-[#FFFDFA] border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#FF6B0A] uppercase">
                VERIFIED SECURITY BEHAVIOR
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1916]">
                Built for defensible, transparent operations.
              </h2>
              <p className="text-[#6D665F] text-sm sm:text-base leading-relaxed">
                We clearly document the actual security controls implemented in this codebase.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#26764F]" />
                  <span>Session Authentication</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  Support workspaces require verified JWT session cookies managed with httpOnly flags and Scalekit OAuth.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#FF6B0A]" />
                  <span>Server-Side Credentials</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  Model and search API keys reside solely in environment variables on the Express backend and are never sent to the browser.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#26764F]" />
                  <span>Human-in-the-Loop Review</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  AI suggestions remain drafts until approved by an operator. Drafts can be freely edited before resolving a ticket.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#FF6B0A]" />
                  <span>Source Traceability</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  Every citation includes validated external URLs and snippet context, ensuring claims are verifiable.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#A66314]" />
                  <span>Bounded Execution</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  External search requests carry 6-second timeout guards to prevent hanging requests or runaway model execution loops.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E7DFD5] space-y-2.5">
                <div className="font-bold text-sm text-[#1C1916] flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#26764F]" />
                  <span>Automatic Fallback Isolation</span>
                </div>
                <p className="text-xs text-[#6D665F] leading-relaxed">
                  Provider failures trigger graceful fallback to secondary engines with full telemetry logs rather than crashing the request.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQ ACCORDION                                                            */}
        {/* ========================================================================= */}
        <section id="faq" className="py-20 sm:py-28 border-b border-[#E7DFD5]">
          <div className="mx-auto max-w-4xl px-6 space-y-12">
            <div className="text-center space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#FF6B0A] uppercase">
                FREQUENTLY ASKED QUESTIONS
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1916]">
                Questions & Answers
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] overflow-hidden transition"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#1C1916] hover:bg-[#F8F5F0] transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#6D665F] transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-[#FF6B0A]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#6D665F] leading-relaxed border-t border-[#E7DFD5]/60">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINAL CALL TO ACTION                                                     */}
        {/* ========================================================================= */}
        <section className="py-20 bg-[#1C1916] text-[#FFFDFA]">
          <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FFFDFA]">
              Ready to streamline your customer support?
            </h2>
            <p className="text-[#8A8279] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Open the agent workspace to manage tickets, test model providers, and review real-time grounding diagnostics.
            </p>
            <div className="pt-2">
              <Button
                onClick={handleAction}
                size="lg"
                className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold px-8 py-3.5 rounded-full shadow-md"
              >
                <span>Enter Agent Console</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7DFD5] bg-[#FFFDFA] py-8 text-xs text-[#6D665F]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-[#1C1916]">
            <Bot className="h-4 w-4 text-[#FF6B0A]" />
            <span>SupportDesk AI</span>
          </div>
          <div>
            Built with React 19, Express 5, LangGraph & Multi-Provider AI Orchestration.
          </div>
          <div className="text-[#8A8279]">
            © 2026 SupportDesk AI.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
