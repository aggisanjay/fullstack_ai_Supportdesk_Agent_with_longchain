import { useState } from "react";
import { Bot, X, Shield, ArrowRight, Sparkles, KeyRound, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { apiPost } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithPopup, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleScalekitLogin = () => {
    setLoading(true);
    setError("");
    loginWithPopup(() => {
      setLoading(false);
      onClose();
      navigate("/support");
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Try fast e2e login if available
      const res = await apiPost<{ ok: boolean }>("/auth/e2e/login", {
        email: email.trim(),
        name: email.split("@")[0].toUpperCase(),
        id: "usr_" + Math.random().toString(36).substring(2, 9)
      });

      if (res.ok) {
        await refetchUser();
        setLoading(false);
        onClose();
        navigate("/support");
        return;
      }
    } catch {
      // fallback to Scalekit OAuth popup
    }

    // Fallback to Scalekit OAuth popup
    loginWithPopup(() => {
      setLoading(false);
      onClose();
      navigate("/support");
    });
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiPost<{ ok: boolean }>("/auth/e2e/login", {
        email: "aggisanjay1234@gmail.com",
        name: "AGGI SANJAY",
        id: "usr_123259178654368517"
      });

      if (res.ok) {
        await refetchUser();
        setLoading(false);
        onClose();
        navigate("/support");
        return;
      }
    } catch {
      // fallback to Scalekit
    }

    loginWithPopup(() => {
      setLoading(false);
      onClose();
      navigate("/support");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#0B0E17] border border-violet-500/30 p-7 sm:p-8 shadow-2xl shadow-violet-950/50 z-10 space-y-6 overflow-hidden">
        
        {/* Top ambient radial glow */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center">
              <span>SupportDesk</span>
              <span className="ml-1 text-violet-400">AI</span>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              <Shield className="h-2.5 w-2.5" />
              Scalekit SSO
            </span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight pt-2">
            Sign in to your console
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access autonomous ticket resolution, live grounding diagnostics, and agent analytics.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Primary Action: Scalekit SSO Button */}
        <div className="space-y-3">
          <button
            onClick={handleScalekitLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-violet-600/30 hover:scale-[1.01] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Continue with Scalekit SSO</span>
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              OR WORK EMAIL
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full saas-input rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <span>Continue with Email</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </form>
        </div>

        {/* 1-Click Fast Developer Access */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Fast 1-Click Lead Access (Instant Login)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
