import { useState, useEffect } from "react";
import { Send } from "lucide-react";

export default function HeroChatDemo() {
  // Step in the conversation loop (0 to 6)
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (step === 0) {
      // Aria greeting initial
      timeout = setTimeout(() => {
        setStep(1); // User asks order status
      }, 1800);
    } else if (step === 1) {
      // User asked -> show typing indicator
      timeout = setTimeout(() => {
        setIsTyping(true);
        setStep(2);
      }, 1000);
    } else if (step === 2) {
      // Typing done -> Aria answers order status
      timeout = setTimeout(() => {
        setIsTyping(false);
        setStep(3);
      }, 1400);
    } else if (step === 3) {
      // User follow-up -> switch address
      timeout = setTimeout(() => {
        setStep(4);
      }, 2000);
    } else if (step === 4) {
      // User asked -> show typing indicator
      timeout = setTimeout(() => {
        setIsTyping(true);
        setStep(5);
      }, 900);
    } else if (step === 5) {
      // Typing done -> Aria confirms updated address
      timeout = setTimeout(() => {
        setIsTyping(false);
        setStep(6);
      }, 1300);
    } else if (step === 6) {
      // Finished conversation -> wait and reset loop
      timeout = setTimeout(() => {
        setStep(0);
      }, 4500);
    }

    return () => clearTimeout(timeout);
  }, [step]);

  return (
    <div className="w-full max-w-[540px] rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col h-[490px] overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3.5 bg-slate-950/40">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ARIA — ONLINE</span>
        </div>
      </div>

      {/* Chat conversation messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs sm:text-sm font-sans flex flex-col justify-start">
        {/* Msg 1: Aria initial greeting */}
        <div className="flex items-start gap-2.5 animate-fadeIn">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-600 px-4 py-2.5 text-white shadow-md shadow-violet-900/20 leading-relaxed font-normal">
            Hi, I'm Aria — the SupportDesk AI agent. How can I help?
          </div>
        </div>

        {/* Msg 2: User asking about order */}
        {step >= 1 && (
          <div className="flex justify-end animate-fadeIn">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-slate-800/90 border border-slate-700/40 px-4 py-2.5 text-slate-100 leading-relaxed">
              Where is my order #8842?
            </div>
          </div>
        )}

        {/* Typing indicator 1 */}
        {isTyping && step === 2 && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="rounded-2xl rounded-tl-sm bg-violet-600/80 px-4 py-3 text-white flex items-center gap-1.5 w-14">
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-3" />
            </div>
          </div>
        )}

        {/* Msg 3: Aria order info */}
        {step >= 3 && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-violet-600 px-4 py-2.5 text-white shadow-md shadow-violet-900/20 leading-relaxed">
              Order #8842 shipped yesterday via DHL and arrives Thursday by 6 PM. I've just sent the tracking link to your email.
            </div>
          </div>
        )}

        {/* Msg 4: User address change request */}
        {step >= 4 && (
          <div className="flex justify-end animate-fadeIn">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-slate-800/90 border border-slate-700/40 px-4 py-2.5 text-slate-100 leading-relaxed">
              Can I switch it to my office address?
            </div>
          </div>
        )}

        {/* Typing indicator 2 */}
        {isTyping && step === 5 && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="rounded-2xl rounded-tl-sm bg-violet-600/80 px-4 py-3 text-white flex items-center gap-1.5 w-14">
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-2" />
              <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-3" />
            </div>
          </div>
        )}

        {/* Msg 5: Aria address confirmation */}
        {step >= 6 && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-violet-600 px-4 py-2.5 text-white shadow-md shadow-violet-900/20 leading-relaxed">
              Done — delivery updated to your office address. Anything else I can take care of?
            </div>
          </div>
        )}
      </div>

      {/* Pinned realistic input bar */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/70 border border-slate-800/70 px-4 py-2.5 text-xs text-slate-500">
          <span>Reply to Aria...</span>
          <div className="h-6 w-6 rounded-full bg-violet-600/60 flex items-center justify-center text-white/70">
            <Send className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
