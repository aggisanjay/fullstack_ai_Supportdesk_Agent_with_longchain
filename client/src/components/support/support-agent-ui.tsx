import type { Provider, ResultState } from "@/lib/support.types";
import { Button } from "../ui/button";
import { Bot, Sparkles, ExternalLink, Send, Loader2, Database, Globe } from "lucide-react";

type Props = {
  provider: Provider;
  onProviderChange: (p: Provider) => void;

  ticket: string;
  onTicketChange: (val: string) => void;

  loading: boolean;

  result: ResultState | null;

  onAgentRun: () => void;
};

export default function SupportAgentUi(props: Props) {
  const {
    result,
    provider,
    loading,
    onProviderChange,
    ticket,
    onTicketChange,
    onAgentRun,
  } = props;

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1916] font-sans selection:bg-[#FFF0E4] selection:text-[#1C1916]">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
        
        {/* Header Strip */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#E7DFD5] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD8BF] bg-[#FFF0E4] px-3.5 py-1 text-xs font-semibold text-[#E85B00] shadow-xs">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#26764F]" />
              Grounded Agent Console
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1C1916] flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#1C1916] text-[#FF6B0A] flex items-center justify-center shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <span>Support Desk Agent</span>
            </h1>
          </div>

          {(result?.sources?.length ?? 0) > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7DFD5] bg-[#FFFDFA] px-4 py-1.5 text-xs text-[#1C1916] font-mono shadow-xs">
              <Database className="h-3.5 w-3.5 text-[#FF6B0A]" />
              <span>Grounding Sources:</span>
              <strong className="text-[#1C1916]">{result!.sources.length}</strong>
            </div>
          ) : null}
        </div>

        {/* 2-Column Workspace Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="saas-card rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6D665F]">
                  Model Engine
                </label>
                <select
                  value={provider}
                  onChange={(event) =>
                    onProviderChange(event.target.value as Provider)
                  }
                  disabled={loading}
                  className="custom-select w-full saas-input rounded-xl p-3 text-sm text-[#1C1916] cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Flash)</option>
                  <option value="groq">Groq (LLaMA 3.3 70B)</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6D665F]">
                  Client Ticket / Inquiry
                </label>
                <textarea
                  value={ticket}
                  disabled={loading}
                  onChange={(e) => onTicketChange(e.target.value)}
                  placeholder="Paste incoming ticket text or customer email to analyze..."
                  className="min-h-48 w-full saas-input rounded-xl p-3.5 text-xs sm:text-sm text-[#1C1916] placeholder:text-[#8A8279] resize-y leading-relaxed font-normal"
                />
              </div>

              <Button
                onClick={onAgentRun}
                disabled={loading || !ticket.trim()}
                className="w-full bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#1C1916]" />
                    <span>Running Orchestration...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Run Agent Pipeline</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Output & Sources */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="saas-card rounded-2xl p-12 text-center text-[#8A8279] space-y-3">
                <Bot className="h-10 w-10 mx-auto text-[#D5CCC0]" />
                <h3 className="text-sm font-semibold text-[#1C1916]">No output generated yet</h3>
                <p className="text-xs text-[#6D665F] max-w-sm mx-auto leading-relaxed">
                  Provide an inquiry ticket and click Run Agent Pipeline to synthesize a context-grounded response.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Sources Card */}
                {result.sources.length > 0 && (
                  <div className="saas-card rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-bold text-[#6D665F] uppercase tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#FF6B0A]" />
                      <span>Referenced Sources ({result.sources.length})</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {result.sources.map((source, i) => (
                        <li key={i} className="break-all flex items-center gap-2">
                          <ExternalLink className="h-3.5 w-3.5 text-[#FF6B0A] shrink-0" />
                          <a
                            href={source}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#FF6B0A] hover:text-[#E85B00] hover:underline"
                          >
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reply Card */}
                <div className="saas-card rounded-2xl border-2 border-[#FF6B0A]/40 p-6 shadow-md space-y-3">
                  <div className="text-xs font-bold text-[#E85B00] uppercase tracking-wider flex items-center gap-2 border-b border-[#E7DFD5] pb-2">
                    <Sparkles className="h-4 w-4 text-[#FF6B0A]" />
                    <span>Synthesized Customer Reply</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#1C1916] leading-relaxed whitespace-pre-wrap pt-1 font-normal">
                    {result.reply}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
