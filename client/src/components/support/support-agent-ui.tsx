import type { Provider, ResultState } from "@/lib/support.types";
import { Button } from "../ui/button";

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
    <div className="min-h-screen bg-white">
      {/* glow  */}

      {/* glow  */}

      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-800" />
              Live Agent Console
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Support Desk Agent
            </h1>
          </div>
        </div>

        {(result?.sources?.length ?? 0) > 0 ? (
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
            Sources
            <b>{result!.sources.length}</b>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mt-2 text-sm text-slate-600">
            Provide the ticket only
          </div>

          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <label className="text-xl font-semibold text-slate-700">
                Select Provider
              </label>
              <select
                value={provider}
                onChange={(event) =>
                  onProviderChange(event.target.value as Provider)
                }
                disabled={loading}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value={"openai"}>OpenAI</option>
                <option value={"gemini"}>Gemini</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xl font-semibold text-slate-700">
                Client Ticket/Email
              </label>
              <textarea
                value={ticket}
                disabled={loading}
                onChange={(e) => onTicketChange(e.target.value)}
                className="min-h-50 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm  outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <Button onClick={onAgentRun} disabled={loading} className="w-full">
              {loading ? "Running" : "Run"}
            </Button>
          </div>
        </div>

        {/* right side view */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mt-2 text-sm text-slate-900">
              Customer Reply + Sources
            </div>
          </div>

          {!result ? (
            <div className="mt-4 text-sm p-4 text-slate-600">
              Nothing yet. Run the agent to generate the reply you want
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-900 shadow-sm">
                <ul className="list-disc space-y-1 pl-5">
                  {result.sources.map((source, i) => (
                    <li key={i} className="break-all">
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferer"
                        className="text-indigo-800 hover:underline"
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h1 className="text-sm font-medium text-slate-900">
                  Customer Reply
                </h1>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-900 shadow-sm">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {result.reply}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportAgentUi;
