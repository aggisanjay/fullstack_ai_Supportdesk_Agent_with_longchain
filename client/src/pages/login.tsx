import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { BACKEND_URL } from "@/lib/api";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Sparkles, Shield, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/support", { replace: true });
    }
  }, [loading, user, navigate]);

  function onLogin() {
    window.location.href = `${BACKEND_URL}/auth/login`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-400 flex items-center justify-center text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 font-sans selection:bg-violet-600 selection:text-white relative overflow-hidden flex flex-col justify-between">
      
      {/* Background ambient radial glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="glow-ambient hero-glow-indigo top-[-20%] left-[20%] w-[600px] h-[600px]" />
        <div className="glow-ambient hero-glow-violet bottom-[-10%] right-[10%] w-[650px] h-[650px]" />
      </div>

      {/* Top logo navbar */}
      <header className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
            <Bot className="h-5 w-5" />
          </div>
          <div className="text-base font-bold tracking-tight text-white flex items-center">
            <span>SupportDesk</span>
            <span className="ml-1 text-violet-400">AI</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          ← Back to Homepage
        </Link>
      </header>

      {/* Main Login Card Section */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 sm:py-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Branding & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-600/10 px-3.5 py-1 text-xs font-medium text-violet-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Support Intelligence
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Triage tickets. Draft replies.
              <span className="block text-violet-400 mt-1">
                Save runs for audit and reuse.
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed">
              Connect your helpdesk to activate Aria — the real-time AI support agent
              grounded in your knowledge base with sentiment tracking and instant handoff.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/90 p-5 shadow-sm space-y-1.5">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span>Structured Output</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Categorization, confidence scores, and action plans.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/90 p-5 shadow-sm space-y-1.5">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  <span>Verified Grounding</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Strict hallucination prevention and citation tracking.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-5 lg:justify-self-end w-full max-w-md">
            <div className="w-full rounded-3xl border border-slate-800/90 bg-[#0E121E]/95 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Continue to Agent
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access your ticket queues, knowledge base, and analytics.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  data-testid="login-btn"
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                  onClick={onLogin}
                >
                  <span>Login with SSO / Credentials</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-500">
                Protected by enterprise encryption and Scalekit auth.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer bar */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs font-mono text-slate-600">
        © 2026 SUPPORTDESK AI, INC. ALL RIGHTS RESERVED.
      </footer>

    </div>
  );
}
