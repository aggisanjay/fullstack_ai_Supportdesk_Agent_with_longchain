import { useEffect, useState } from "react";

interface AppLoadingScreenProps {
  /**
   * If true, keeps the screen visible. When set to false, performs the
   * Any.do checkmark success lock-in and smoothly fades out.
   */
  isLoading?: boolean;
  /**
   * Optional custom title or message to show
   */
  customMessage?: string;
  /**
   * Optional callback when the fade out transition has fully finished
   */
  onFinished?: () => void;
  /**
   * Minimum duration in ms to show the loader to prevent jarring flashes
   * Defaults to 900ms.
   */
  minDuration?: number;
}

const PRODUCTIVITY_STEPS = [
  { text: "Loading SupportDesk workspace...", sub: "Restoring persistent agent state" },
  { text: "Connecting pgvector semantic store...", sub: "Querying 1536-dim runbook embeddings" },
  { text: "Calibrating LangGraph orchestrator...", sub: "Verifying Gemini, OpenAI & Groq fallbacks" },
  { text: "Workspace synchronized", sub: "Ready for live support operations" },
];

export default function AppLoadingScreen({
  isLoading = true,
  customMessage,
  onFinished,
  minDuration = 900,
}: AppLoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [canExit, setCanExit] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Guarantee minimum display duration to avoid UI flicker
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setCanExit(true);
    }, minDuration);

    return () => clearTimeout(minTimer);
  }, [minDuration]);

  // Smoothly advance progress and step messages
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (!isLoading && canExit) {
          return 100;
        }
        // Naturally progress up to ~92% while waiting for real completion
        if (prev < 40) return prev + 12;
        if (prev < 70) return prev + 8;
        if (prev < 90) return prev + 3;
        return prev;
      });
    }, 280);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < PRODUCTIVITY_STEPS.length - 2 ? prev + 1 : prev));
    }, 700);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isLoading, canExit]);

  // When loading completes and min duration met -> Trigger Any.do success snap then fade out
  useEffect(() => {
    if (!isLoading && canExit) {
      setProgress(100);
      setStepIndex(PRODUCTIVITY_STEPS.length - 1);
      setIsSuccess(true);

      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 450);

      const unmountTimer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 950);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [isLoading, canExit, onFinished]);

  const currentStep = PRODUCTIVITY_STEPS[stepIndex];

  return (
    <div
      aria-live="polite"
      aria-busy={!isSuccess}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090B] text-white select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100 pointer-events-auto"
      }`}
    >
      {/* Ambient background radial breathing aura */}
      <div
        className={`absolute w-72 h-72 rounded-full transition-all duration-700 blur-[80px] pointer-events-none ${
          isSuccess
            ? "bg-emerald-500/20 scale-125"
            : "bg-[#FF6B0A]/15 scale-100 animate-pulse"
        }`}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Any.do Signature Productivity SVG Loader */}
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          {/* Subtle Outer Track */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r="30"
              className="stroke-white/[0.08]"
              strokeWidth="3.5"
              fill="transparent"
            />
            {/* Fluid Drawing Arc */}
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="transparent"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={`transition-all duration-500 ease-out ${
                isSuccess ? "stroke-emerald-400" : "stroke-[#FF6B0A]"
              }`}
              style={{
                strokeDasharray: 188.5,
                strokeDashoffset: 188.5 - (188.5 * progress) / 100,
              }}
            />
          </svg>

          {/* Center Checkmark / Brand Glyph (Draws in like Any.do) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isSuccess ? (
              <svg
                className="w-8 h-8 text-emerald-400 transform transition-all duration-500 scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M5 13l4 4L19 7"
                  className="animate-[anydo-draw_0.4s_ease-out_forwards]"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 0,
                  }}
                />
              </svg>
            ) : (
              /* Any.do Staggered Mini-Bar Equalizer while loading */
              <div className="flex items-center gap-1.5 h-6">
                <span
                  className="w-1 bg-[#FF6B0A] rounded-full animate-[anydo-bar_1.1s_ease-in-out_infinite]"
                  style={{ animationDelay: "0ms", height: "14px" }}
                />
                <span
                  className="w-1 bg-white rounded-full animate-[anydo-bar_1.1s_ease-in-out_infinite]"
                  style={{ animationDelay: "180ms", height: "20px" }}
                />
                <span
                  className="w-1 bg-[#FF6B0A] rounded-full animate-[anydo-bar_1.1s_ease-in-out_infinite]"
                  style={{ animationDelay: "360ms", height: "12px" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step Typography & Crossfade */}
        <div className="min-h-[58px] flex flex-col items-center justify-center mb-6">
          <h3 className="text-base font-semibold tracking-tight text-white transition-all duration-300">
            {customMessage || currentStep.text}
          </h3>
          <p className="text-xs text-gray-400 font-normal mt-1 tracking-wide">
            {currentStep.sub}
          </p>
        </div>

        {/* Minimal Progress Bar with Soft Edge & Percentage */}
        <div className="w-52 flex flex-col items-center gap-2">
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isSuccess
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-gradient-to-r from-[#FF6B0A] to-amber-400 shadow-[0_0_8px_rgba(255,107,10,0.5)]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span className="uppercase tracking-widest text-[9px]">
              {isSuccess ? "Ready" : "Syncing"}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom System Badge */}
      <div className="absolute bottom-8 flex items-center gap-2 text-[11px] text-gray-500 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SupportDesk AI • LangGraph Engine</span>
      </div>
    </div>
  );
}
