import { useState, useEffect } from "react";
import { Send, Sparkles, CheckCircle2, Globe, Cpu } from "lucide-react";

export default function HeroChatDemo() {
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (step === 0) {
      timeout = setTimeout(() => {
        setStep(1);
      }, 1500);
    } else if (step === 1) {
      timeout = setTimeout(() => {
        setIsTyping(true);
        setStep(2);
      }, 900);
    } else if (step === 2) {
      timeout = setTimeout(() => {
        setIsTyping(false);
        setStep(3);
      }, 1200);
    } else if (step === 3) {
      timeout = setTimeout(() => {
        setStep(4);
      }, 2200);
    } else if (step === 4) {
      timeout = setTimeout(() => {
        setIsTyping(true);
        setStep(5);
      }, 900);
    } else if (step === 5) {
      timeout = setTimeout(() => {
        setIsTyping(false);
        setStep(6);
      }, 1300);
    } else if (step === 6) {
      timeout = setTimeout(() => {
        setStep(0);
      }, 5000);
    }

    return () => clearTimeout(timeout);
  }, [step]);

  return (
    <div className="w-full max-w-[540px] rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] shadow-xl flex flex-col h-[490px] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#E7DFD5] px-5 py-3 bg-[#F8F5F0]">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
          <span className="text-[11px] font-semibold text-[#6D665F] ml-2">Ticket #1042 — Preview</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#E6F4EA] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-semibold text-[#26764F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#26764F] animate-pulse" />
          <span>Copilot Live</span>
        </div>
      </div>

      {/* Meta context pill bar */}
      <div className="px-5 py-2.5 bg-[#FFF0E4] border-b border-[#FFD8BF] flex items-center justify-between text-[11px] text-[#1C1916]">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-[#FF6B0A]" />
          <span className="font-semibold">Detected Category:</span>
          <span className="bg-[#FFFDFA] px-2 py-0.5 rounded border border-[#FFD8BF] text-[#E85B00] font-medium">technical/integration</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-[#6D665F]">
          <Sparkles className="h-3 w-3 text-[#FF6B0A]" />
          <span>Confidence: 92%</span>
        </div>
      </div>

      {/* Chat conversation messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs sm:text-sm flex flex-col justify-start">
        {/* Msg 1: Customer initial issue */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F0EBE3] border border-[#E7DFD5] p-3.5 text-[#1C1916] leading-relaxed">
            <div className="text-[10px] font-bold text-[#6D665F] mb-1 uppercase tracking-wider">Customer Inquiry</div>
            We keep receiving a <code className="bg-[#FFFDFA] px-1 py-0.5 rounded border border-[#E7DFD5] text-[#1C1916]">redirect_uri_mismatch</code> error when trying to authenticate with OAuth. Where do we register the callback?
          </div>
        </div>

        {/* Typing indicator */}
        {isTyping && (step === 2 || step === 5) && (
          <div className="flex items-start gap-2.5">
            <div className="rounded-2xl rounded-tl-sm bg-[#FFF0E4] border border-[#FFD8BF] px-4 py-3 text-[#FF6B0A] flex items-center gap-1.5 w-14">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B0A] typing-dot-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B0A] typing-dot-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B0A] typing-dot-3" />
            </div>
          </div>
        )}

        {/* Msg 2: AI Draft Response */}
        {step >= 3 && (
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-[#FFFDFA] border-2 border-[#FF6B0A]/40 p-3.5 text-[#1C1916] shadow-sm leading-relaxed">
              <div className="text-[10px] font-bold text-[#E85B00] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#26764F]" />
                <span>AI Drafted Resolution</span>
              </div>
              <p>
                This error occurs when the callback URL passed in your authorization request does not match the authorized redirect URI list.
              </p>
              <p className="mt-2 text-xs text-[#6D665F]">
                In your dashboard, navigate to <strong>API Settings &gt; Redirect URIs</strong> and ensure <code className="bg-[#F0EBE3] px-1 rounded text-[#1C1916]">http://localhost:5000/auth/callback</code> is registered.
              </p>
              <div className="mt-2.5 pt-2 border-t border-[#E7DFD5] flex items-center gap-2 text-[10px] text-[#6D665F]">
                <Globe className="h-3 w-3 text-[#FF6B0A]" />
                <span>Grounding: 1 Internal Runbook + 2 Developer Docs</span>
              </div>
            </div>
          </div>
        )}

        {/* Msg 3: Customer follow up */}
        {step >= 4 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F0EBE3] border border-[#E7DFD5] p-3 text-[#1C1916] leading-relaxed">
              Updated the URI and tested code exchange — confirmed working! Thank you.
            </div>
          </div>
        )}

        {/* Msg 4: AI closure draft */}
        {step >= 6 && (
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-[#E6F4EA] border border-[#A7F3D0] p-3 text-[#26764F] leading-relaxed text-xs">
              Glad to hear that fixed the issue! I'll mark this ticket resolved. Let us know if you need anything else.
            </div>
          </div>
        )}
      </div>

      {/* Pinned realistic input bar */}
      <div className="p-3 border-t border-[#E7DFD5] bg-[#F8F5F0]">
        <div className="flex items-center justify-between rounded-xl bg-[#FFFDFA] border border-[#E7DFD5] px-3.5 py-2 text-xs text-[#8A8279]">
          <span>Approve reply or add human note...</span>
          <div className="h-6 w-6 rounded-lg bg-[#FF6B0A] flex items-center justify-center text-[#1C1916]">
            <Send className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
