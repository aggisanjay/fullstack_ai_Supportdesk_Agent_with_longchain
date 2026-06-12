import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { BACKEND_URL } from "@/lib/api";
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Cpu, 
  Database, 
  Globe, 
  Users
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [workflowStep, setWorkflowStep] = useState(0);

  // Auto-advance the agent workflow visualization
  useEffect(() => {
    const timer = setInterval(() => {
      setWorkflowStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/login`;
  };

  const faqs = [
    {
      question: "How does the grounding system work?",
      answer: "When a customer submits a ticket, our platform queries your uploaded internal Knowledge Base articles first. If technical keywords or documentation queries are detected, we optionally fetch search results from Tavily. The combined content is grounded to prevent AI hallucinations and provide verified answers.",
    },
    {
      question: "Can we switch between different AI models?",
      answer: "Yes, you can toggle between OpenAI (GPT-4o-mini) and Google Gemini (Gemini 1.5 Flash) with a single click in the console, depending on speed and response complexity requirements.",
    },
    {
      question: "What is the escalation workflow?",
      answer: "If the AI response has a low confidence score (e.g. < 70%) or the customer's sentiment is flagged as frustrated or critical, the ticket is auto-flagged for escalation. An agent dashboard displays suggested human responses and action items to ensure swift resolution.",
    },
    {
      question: "Is single sign-on (SSO) supported?",
      answer: "Yes! Scalekit integration is built in, supporting secure enterprise authentication (SAML, OIDC, Okta, and Azure AD) alongside JWT cookie sessions.",
    },
  ];

  const agentSteps = [
    {
      name: "Intent Agent",
      desc: "Classifies query topic and customer mood",
      output: "Intent: Webhook Signature Failure • Mood: Frustrated",
      color: "border-indigo-500 text-indigo-600 bg-indigo-50"
    },
    {
      name: "Knowledge Agent",
      desc: "Queries internal KB articles for matching guides",
      output: "Matched 1 article: 'Resolving Webhook Signature Failures'",
      color: "border-emerald-500 text-emerald-600 bg-emerald-50"
    },
    {
      name: "Search Agent",
      desc: "Fetches live internet sources if info is missing",
      output: "Retrieved 2 docs from Tavily: 'express raw body signature verify'",
      color: "border-sky-500 text-sky-600 bg-sky-50"
    },
    {
      name: "Response Agent",
      desc: "Drafts a safe structured reply and confidence metrics",
      output: "Generated Draft • Confidence: 89% • Sources: 2",
      color: "border-violet-500 text-violet-600 bg-violet-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-md font-bold tracking-tight text-white">Support Planner</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          {/* CTA / Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/support"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-sky-500 blur-[130px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering support with multi-agent intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight md:leading-none">
            Automate Support Workflows with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">Grounded Multi-Agent AI</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Verify intent, ground response drafts in your Knowledge Base, auto-triage tickets, and escalate securely with complete agent visibility.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <Link to="/support" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-600/20 transition duration-200 flex items-center justify-center gap-2 group">
                Access Workspace Dashboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button onClick={handleLogin} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-600/20 transition duration-200 flex items-center justify-center gap-2 group cursor-pointer">
                Get Started Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <a href="#workflow" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition duration-200 border border-slate-700/80 flex items-center justify-center">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 bg-slate-950 border-y border-slate-800/60 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">SaaS Features Built for Support Teams</h2>
            <p className="mt-4 text-slate-400 font-light max-w-xl mx-auto">
              Everything you need to automate, audit, and analyze support operations safely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition duration-300 shadow-sm flex flex-col h-full">
              <div className="p-3 bg-indigo-600/10 rounded-xl w-fit text-indigo-400 mb-5">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Knowledge Base System</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Upload troubleshooting documents, internal guides, or FAQs. The platform fetches and injects relevant articles into customer reply drafts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition duration-300 shadow-sm flex flex-col h-full">
              <div className="p-3 bg-sky-600/10 rounded-xl w-fit text-sky-400 mb-5">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Agent Orchestration</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                View execution chains of four specialized agents (Intent, KB search, Web search, and Response draft) to audit steps in real time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition duration-300 shadow-sm flex flex-col h-full">
              <div className="p-3 bg-emerald-600/10 rounded-xl w-fit text-emerald-400 mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confidence & Escalation</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Identify low confidence scores and critical/frustrated user sentiment. Auto-escalate cases with suggested actions and human drafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Agent Workflow Animation */}
      <section id="workflow" className="py-20 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Interactive Pipeline</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Visible Multi-Agent Workflow</h2>
              <p className="mt-4 text-slate-400 leading-relaxed font-light">
                Don't guess what the AI did. Watch our multi-agent support network process user tickets through distinct audit steps.
              </p>
              
              <div className="mt-8 space-y-4">
                {agentSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setWorkflowStep(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                      workflowStep === idx 
                        ? "bg-slate-800/80 border-indigo-500 shadow-md scale-[1.02]" 
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{idx + 1}</span>
                        {step.name}
                      </h4>
                      {workflowStep === idx && <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Agent Execution Terminal Screen */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500 ml-2 font-mono">agent_workflow.log</span>
              </div>
              
              <div className="mt-8 font-mono text-xs space-y-4 pt-2 min-h-[280px]">
                <div className="text-slate-500">{"$ run-agent-pipeline --ticket-id 9842"}</div>
                
                {workflowStep >= 0 && (
                  <div className="space-y-1">
                    <div className="text-indigo-400">{"[1] INTENT_AGENT: STARTING"}</div>
                    <div className="text-slate-300 pl-4">{"> Ticket categorised as Integration Bug"}</div>
                    <div className="text-slate-300 pl-4">{"> Customer feeling: FRUSTRATED"}</div>
                  </div>
                )}

                {workflowStep >= 1 && (
                  <div className="space-y-1 animate-fadeIn">
                    <div className="text-emerald-400">{"[2] KNOWLEDGE_AGENT: QUERYING"}</div>
                    <div className="text-slate-300 pl-4">{"> Checked internal documents index"}</div>
                    <div className="text-slate-300 pl-4">{"> Found article matching 'Express webhook verification'" }</div>
                  </div>
                )}

                {workflowStep >= 2 && (
                  <div className="space-y-1 animate-fadeIn">
                    <div className="text-sky-400">{"[3] SEARCH_AGENT: GROUNDING"}</div>
                    <div className="text-slate-300 pl-4">{"> Running grounding search on Tavily..."}</div>
                    <div className="text-slate-500 pl-4">{"- Target query: express webhook raw body crypto signature"}</div>
                  </div>
                )}

                {workflowStep >= 3 && (
                  <div className="space-y-1 animate-fadeIn">
                    <div className="text-violet-400">{"[4] RESPONSE_AGENT: FINALIZING"}</div>
                    <div className="text-slate-300 pl-4">{"> Validated strict response format via Zod"}</div>
                    <div className="text-emerald-300 pl-4 font-semibold">{"> Complete reply generated. Confidence: 89%"}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-slate-950 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Engineered for Technical Support Teams</h2>
            <p className="mt-4 text-slate-400 font-light max-w-xl mx-auto">
              Automate routine queries, audit system replies, and protect enterprise SLAs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4">
              <div className="p-3 bg-indigo-600/10 rounded-xl h-fit text-indigo-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Developer API Support</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Provide developers with instant, search-grounded answers about API endpoints, webhook payloads, and signature hashing code blocks automatically.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4">
              <div className="p-3 bg-sky-600/10 rounded-xl h-fit text-sky-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Enterprise SSO Onboarding</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Support customer IT admins configuring Okta, SAML, and SSO client secrets by matching their setup issues to relevant guides in your KB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Transparent Pricing for Any Organization</h2>
            <p className="mt-4 text-slate-400 font-light">
              Choose the plan that fits your help desk workload. Scale as you automate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col h-full">
              <h4 className="text-lg font-bold text-white mb-2">Free Starter</h4>
              <p className="text-slate-400 text-xs mb-6">For small dev playgrounds</p>
              <div className="text-3xl font-extrabold text-white mb-6">$0</div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  OpenAI or Gemini Toggle
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Manual Knowledge Base Uploads
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Up to 50 agent runs / month
                </li>
              </ul>
              {user ? (
                <Link to="/support" className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-center font-medium transition duration-200">
                  Dashboard Workspace
                </Link>
              ) : (
                <button onClick={handleLogin} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-center font-medium transition duration-200 cursor-pointer">
                  Sign Up Free
                </button>
              )}
            </div>

            {/* Growth */}
            <div className="p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500 relative flex flex-col h-full shadow-lg shadow-indigo-600/10">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Growth SaaS</h4>
              <p className="text-slate-400 text-xs mb-6">For growing customer support operations</p>
              <div className="text-3xl font-extrabold text-white mb-6">
                $79 <span className="text-sm font-normal text-slate-400">/ mo</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  All Starter features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Tavily Search Grounding
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Auto-Escalation & suggested actions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Full analytics dashboard
                </li>
              </ul>
              {user ? (
                <Link to="/support" className="w-full py-3 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl text-center font-medium transition duration-200">
                  Dashboard Workspace
                </Link>
              ) : (
                <button onClick={handleLogin} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center font-medium transition duration-200 cursor-pointer">
                  Start 14-Day Trial
                </button>
              )}
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col h-full">
              <h4 className="text-lg font-bold text-white mb-2">Enterprise</h4>
              <p className="text-slate-400 text-xs mb-6">For dedicated large helpdesks</p>
              <div className="text-3xl font-extrabold text-white mb-6">Custom</div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  SAML SSO & Custom Identity settings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Unlimited Knowledge docs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Dedicated support & API access
                </li>
              </ul>
              {user ? (
                <Link to="/support" className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-center font-medium transition duration-200">
                  Dashboard Workspace
                </Link>
              ) : (
                <button onClick={handleLogin} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-center font-medium transition duration-200 cursor-pointer">
                  Contact Sales
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800/60 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-400 font-light">
              Clear up any questions you have about the agent framework.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center text-white hover:text-indigo-300 transition duration-200 font-medium"
                >
                  {faq.question}
                  {activeFaq === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800/40 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="absolute top-[20%] left-[40%] w-[350px] h-[350px] rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Upgrade Your Support Workflow Today
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-light leading-relaxed mb-10">
            Empower your human support agents with context-aware, grounded AI drafts that decrease resolution time by up to 60%.
          </p>
          {user ? (
            <Link to="/support" className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-wide shadow-xl hover:shadow-indigo-600/30 transition duration-200 inline-flex items-center gap-2">
              Access Workspace Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <button onClick={handleLogin} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-wide shadow-xl hover:shadow-indigo-600/30 transition duration-200 inline-flex items-center gap-2 cursor-pointer">
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 border-t border-slate-800/60 bg-slate-950 text-center text-xs text-slate-500 font-mono">
        © 2026 Support Planner Inc. All rights reserved. Powered by LangGraph & Scalekit.
      </footer>
    </div>
  );
}
