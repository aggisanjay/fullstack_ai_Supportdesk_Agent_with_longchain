import type { Provider, ResultState } from "@/lib/support.types";
import { Button } from "../ui/button";
import { Bot, Sparkles, ExternalLink, Send, Loader2, Database } from "lucide-react";

type Props = {
  provider: Provider;
  onProviderChange: (p: Provider) => void;

  ticket: string;
  onTicketChange: (val: string) => void;

  loading: boolean;

  result: ResultState | null;

  onAgentRun: () => void;
};

function SupportAgentUi(props: Props) {
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
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-violet-600 selection:text-white">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
        
        {/* Header Strip */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-600/10 px-3.5 py-1 text-xs font-medium text-violet-300 shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Agent Console
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/25">
                <Bot className="h-5 w-5" />
              </div>
              <span>Support Desk Agent</span>
            </h1>
          </div>

          {(result?.sources?.length ?? 0) > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-1.5 text-xs text-slate-300 font-mono shadow-sm">
              <Database className="h-3.5 w-3.5 text-violet-400" />
              <span>Grounding Sources:</span>
              <strong className="text-white">{result!.sources.length}</strong>
            </div>
          ) : null}
        </div>

        {/* 2-Column Workspace Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="saas-card rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Model Engine
                </label>
                <select
                  value={provider}
                  onChange={(event) =>
                    onProviderChange(event.target.value as Provider)
                  }
                  disabled={loading}
                  className="custom-select w-full saas-input rounded-xl p-3 text-sm text-white cursor-pointer shadow-sm"
                >
                  <option value="gemini">Google Gemini (Flash)</option>
                  <option value="groq">Groq (LLaMA 3.3 70B)</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Client Ticket / Inquiry
                </label>
                <textarea
                  value={ticket}
                  disabled={loading}
                  onChange={(e) => onTicketChange(e.target.value)}
                  placeholder="Paste incoming ticket text or customer email to analyze..."
                  className="min-h-48 w-full saas-input rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 resize-y leading-relaxed shadow-inner font-normal"
                />
              </div>

              <Button
                onClick={onAgentRun}
                disabled={loading || !ticket.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
              <div className="saas-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
                <Bot className="h-10 w-10 mx-auto text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300">No output generated yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Provide an inquiry ticket and click Run Agent Pipeline to synthesize a context-grounded response.
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                {/* Sources Card */}
                {result.sources.length > 0 && (
                  <div className="saas-card rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Database className="h-4 w-4 text-violet-400" />
                      <span>Referenced Knowledge Sources ({result.sources.length})</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {result.sources.map((source, i) => (
                        <li key={i} className="break-all flex items-center gap-2">
                          <ExternalLink className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <a
                            href={source}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-400 hover:text-violet-300 hover:underline"
                          >
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reply Card */}
                <div className="saas-card rounded-2xl border-violet-500/50 p-6 shadow-xl space-y-3">
                  <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2 border-b border-violet-500/20 pb-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Synthesized Customer Reply</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap pt-1 font-normal">
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

export default SupportAgentUi;
