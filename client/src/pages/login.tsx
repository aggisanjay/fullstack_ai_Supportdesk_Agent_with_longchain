import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Sparkles, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { BACKEND_URL } from "@/lib/api";

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
      <div className="min-h-screen bg-[#F8F5F0] text-[#6D665F] flex items-center justify-center text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF6B0A] animate-ping" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1916] font-sans relative flex flex-col justify-between selection:bg-[#FFF0E4] selection:text-[#1C1916]">
      {/* Top logo navbar */}
      <header className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between border-b border-[#E7DFD5]">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1C1916] text-[#FF6B0A] shadow-xs transition-transform group-hover:scale-105">
            <Bot className="h-5 w-5" />
          </div>
          <div className="text-base font-bold tracking-tight text-[#1C1916] flex items-center">
            <span>SupportDesk</span>
            <span className="ml-1 text-[#FF6B0A]">AI</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-medium text-[#6D665F] hover:text-[#1C1916] transition"
        >
          ← Back to Homepage
        </Link>
      </header>

      {/* Main Login Card Section */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Branding & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD8BF] bg-[#FFF0E4] px-3.5 py-1 text-xs font-semibold text-[#E85B00]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#26764F]" />
              AI-Powered Customer Support
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1916] leading-tight">
              Triage tickets with clarity.
              <span className="block text-[#FF6B0A] mt-1">
                Draft grounded replies in seconds.
              </span>
            </h1>

            <p className="text-[#6D665F] text-sm sm:text-base max-w-lg leading-relaxed">
              Log into your SupportDesk workspace to review incoming tickets, verify grounded citations, and collaborate with your automated support copilot.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] p-5 shadow-xs space-y-1.5">
                <div className="text-sm font-semibold text-[#1C1916] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF6B0A]" />
                  <span>Structured Triage</span>
                </div>
                <div className="text-xs text-[#6D665F] leading-relaxed">
                  Accurate issue classification, sentiment signals, and action plans.
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] p-5 shadow-xs space-y-1.5">
                <div className="text-sm font-semibold text-[#1C1916] flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#FF6B0A]" />
                  <span>Verified Grounding</span>
                </div>
                <div className="text-xs text-[#6D665F] leading-relaxed">
                  Real source attribution with transparent confidence breakdown.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-5 lg:justify-self-end w-full max-w-md">
            <div className="w-full rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#1C1916]">
                  Sign in
                </h2>
                <p className="text-xs text-[#6D665F] mt-1">
                  Access your ticket queues, knowledge base, and analytics workspace.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  data-testid="login-btn"
                  className="w-full bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  onClick={onLogin}
                >
                  <span>Continue with Scalekit SSO</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-2 text-center text-[11px] text-[#8A8279]">
                Protected by verified enterprise authentication.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer bar */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-[#8A8279] border-t border-[#E7DFD5]">
        © 2026 SupportDesk AI. All rights reserved.
      </footer>
    </div>
  );
}
