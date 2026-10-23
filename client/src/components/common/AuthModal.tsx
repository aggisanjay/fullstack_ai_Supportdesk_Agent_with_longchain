import React, { useState } from "react";
import { Bot, X, Shield, ArrowRight, Sparkles, KeyRound, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { apiPost } from "@/lib/api";
import { Button } from "../ui/button";

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
      const res = await apiPost<{ ok: boolean }>("/auth/e2e/login", {
        email: email.trim(),
        name: email.split("@")[0].replace(/[._-]/g, " ").toUpperCase(),
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
      // Fallback
    }

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
        email: "support_lead@company.com",
        name: "Support Lead",
        id: "usr_lead_demo"
      });

      if (res.ok) {
        await refetchUser();
        setLoading(false);
        onClose();
        navigate("/support");
        return;
      }
    } catch {
      // Fallback
    }

    loginWithPopup(() => {
      setLoading(false);
      onClose();
      navigate("/support");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-[#1C1916]/40 backdrop-blur-xs transition-opacity duration-200" 
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#FFFDFA] border border-[#E7DFD5] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 h-8 w-8 rounded-lg bg-[#F0EBE3] hover:bg-[#E7DFD5] flex items-center justify-center text-[#6D665F] hover:text-[#1C1916] transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C1916] text-[#FF6B0A] shadow-xs">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="text-sm font-bold tracking-tight text-[#1C1916] flex items-center">
              <span>SupportDesk</span>
              <span className="ml-1 text-[#FF6B0A]">AI</span>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#26764F] bg-[#E6F4EA] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-mono">
              <Shield className="h-2.5 w-2.5" />
              Scalekit SSO
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#1C1916] tracking-tight pt-2">
            Sign in to your workspace
          </h3>
          <p className="text-xs text-[#6D665F] leading-relaxed">
            Access autonomous ticket resolution, live grounding diagnostics, and agent analytics.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#B83C35] font-medium">
            {error}
          </div>
        )}

        {/* Primary Action: Scalekit SSO Button */}
        <div className="space-y-3">
          <Button
            onClick={handleScalekitLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold rounded-xl text-xs shadow-xs hover:shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#1C1916]" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Continue with Scalekit SSO</span>
              </>
            )}
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#E7DFD5]" />
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-[#8A8279]">
              OR WORK EMAIL
            </span>
            <div className="flex-grow border-t border-[#E7DFD5]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8A8279]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full saas-input rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1C1916] placeholder:text-[#8A8279]"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold"
            >
              <span>Continue with Email</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#6D665F]" />
            </Button>
          </form>
        </div>

        {/* Fast Developer / Demo Access */}
        <div className="pt-2 border-t border-[#E7DFD5] text-center">
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-[11px] font-semibold text-[#FF6B0A] hover:text-[#E85B00] transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B0A]" />
            <span>Fast 1-Click Access (Instant Demo Session)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
