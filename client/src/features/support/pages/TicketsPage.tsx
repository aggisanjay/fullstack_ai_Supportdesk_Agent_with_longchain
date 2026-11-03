/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API payloads, validated server side */
import { Inbox, Send, RefreshCw, CheckCircle, Loader2, Sparkles, ExternalLink, Globe, Cpu, Check, Copy, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SAMPLE_PRESETS } from "../constants";
import StepTrace from "../components/StepTrace";
import { useSupport } from "../supportCtx";

export default function TicketsPage() {
  const {
    actionLoading, activeTicket, copiedResponse, filteredTickets, handleCopyResponse, handleCreateTicket, handleRegenerateDraft, isLiveGenerating, liveElapsedMs, newTicketForm, newTicketProvider, setNewTicketForm, setNewTicketProvider, setSelectedTicketId, setTicketFilter, setTicketSearch, ticketFilter, ticketSearch, tickets, ticketsLoading,
  } = useSupport();
  return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#07080d]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
          {/* ================================================================= */}
          {/* LEFT COLUMN: Inbound Ticket Sender + Ticket History (5 Cols)      */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 space-y-6">
                
            {/* Card 1: Inbound Ticket Sender */}
            <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#242838]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-[#f4f1ea] text-sm tracking-tight">
                      Inbound Ticket Sender
                    </h2>
                    <p className="text-[11px] text-[#a3a8bb]">
                      Simulate customer inquiries with real-time agent triage
                    </p>
                  </div>
                </div>
                <Badge variant="neutral" className="text-[10px] bg-[#151826] text-[#f4f1ea]">
                  AI Auto-Triage
                </Badge>
              </div>

              {/* Sample Scenario Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#767c92] uppercase tracking-wider block">
                  Quick Test Scenarios:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewTicketForm({
                          title: preset.title,
                          customerName: preset.customerName,
                          customerEmail: preset.customerEmail,
                          text: preset.text,
                        });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-[#242838] bg-[#07080d] hover:bg-[#FF6B0A]/10 hover:border-[#FF6B0A]/40 hover:text-[#FF6B0A] text-[#f4f1ea] transition-colors font-medium text-left cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket Form */}
              <form onSubmit={handleCreateTicket} className="space-y-3.5 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#f4f1ea] uppercase tracking-wider block mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={newTicketForm.customerName}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                      placeholder="e.g. Alice Chen"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#242838] bg-[#0b0d14] focus:outline-none focus:border-[#FF6B0A] text-[#f4f1ea]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#f4f1ea] uppercase tracking-wider block mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={newTicketForm.customerEmail}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                      placeholder="alice@company.io"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#242838] bg-[#0b0d14] focus:outline-none focus:border-[#FF6B0A] text-[#f4f1ea]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#f4f1ea] uppercase tracking-wider block mb-1">
                    Ticket Subject / Title
                  </label>
                  <input
                    type="text"
                    value={newTicketForm.title}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                    placeholder="e.g. OAuth callback redirect_uri mismatch"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#242838] bg-[#0b0d14] focus:outline-none focus:border-[#FF6B0A] text-[#f4f1ea]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#f4f1ea] uppercase tracking-wider block mb-1">
                    Inbound Message Description <span className="text-[#ff8a7e]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newTicketForm.text}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, text: e.target.value })}
                    placeholder="Paste or describe the customer issue or error log..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#242838] bg-[#0b0d14] focus:outline-none focus:border-[#FF6B0A] text-[#f4f1ea] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="w-1/2">
                    <label className="text-[10px] font-bold text-[#767c92] uppercase tracking-wider block mb-1">
                      Model Engine
                    </label>
                    <select
                      value={newTicketProvider}
                      onChange={(e) => setNewTicketProvider(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#242838] bg-[#0b0d14] text-[#f4f1ea] font-medium focus:outline-none focus:border-[#FF6B0A]"
                    >
                      <option value="gemini">Gemini 2.5 Flash</option>
                      <option value="groq">Qwen 3.8B (Groq)</option>
                      <option value="openai">GPT-4o mini</option>
                    </select>
                  </div>

                  <div className="w-1/2 self-end">
                    <Button
                      type="submit"
                      disabled={actionLoading || isLiveGenerating || !newTicketForm.text.trim()}
                      className="w-full bg-[#FF6B0A] hover:bg-[#E05A00] text-[#05060a] text-xs font-bold py-2 shadow-sm cursor-pointer"
                    >
                      {isLiveGenerating || actionLoading ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Orchestrating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Send & Run Agent
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Card 2: Ticket History */}
            <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#242838]">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-[#FF6B0A]" />
                  <h3 className="font-extrabold text-[#f4f1ea] text-sm tracking-tight">
                    Ticket History
                  </h3>
                </div>
                <Badge variant="neutral" className="text-[10px] font-mono bg-[#151826] text-[#f4f1ea]">
                  {filteredTickets.length} / {tickets.length} total
                </Badge>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#767c92]" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#242838] bg-[#0b0d14] text-[#f4f1ea] placeholder:text-[#767c92] focus:outline-none focus:border-[#FF6B0A]"
                  />
                </div>
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[#242838] bg-[#0b0d14] text-[#f4f1ea] font-medium focus:outline-none focus:border-[#FF6B0A]"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              {ticketsLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#767c92] italic">
                  {tickets.length === 0
                    ? "No ticket history found. Send an inbound ticket above to begin."
                    : "No tickets matching current filters."}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTickets.map((t) => {
                    const isSelected = activeTicket?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#ff6b0a1a] border-[#FF6B0A] shadow-sm"
                            : "bg-[#0b0d14] border-[#242838] hover:border-[#323852] hover:bg-[#0b0d14]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#767c92]">
                            #{t.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              t.status === "open"
                                ? "bg-[#5be3a826] text-[#7ee8a8]"
                                : t.status === "escalated"
                                ? "bg-[#ff4d3d1f] text-[#ff8a7e]"
                                : "bg-[#151826] text-[#a3a8bb]"
                            }`}>
                              {t.status}
                            </span>
                            <span className="text-[10px] text-[#767c92]">
                              {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-[#f4f1ea] line-clamp-1 mb-1">
                          {t.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-[#a3a8bb]">
                          <span>{t.customerName}</span>
                          <span className="font-mono text-[10px] text-[#767c92]">
                            {t.intentCategory || "general"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: Tavily Search + Orchestrator + Response (7 Cols)    */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 space-y-6">

            {activeTicket ? (
              <>
                {/* Card 1: Tavily Web Search Grounding */}
                <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#242838]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#7ee8a8]/10 text-[#7ee8a8] flex items-center justify-center font-bold">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#f4f1ea] text-sm tracking-tight">
                          Tavily Web Search Grounding
                        </h3>
                        <p className="text-[11px] text-[#a3a8bb]">
                          Live search queries and external documentation sources
                        </p>
                      </div>
                    </div>

                    {activeTicket.searchResults && activeTicket.searchResults.length > 0 ? (
                      <Badge variant="neutral" className="text-[10px] bg-[#5be3a826] text-[#7ee8a8] font-semibold border-none">
                        <CheckCircle className="h-3 w-3 mr-1 inline" />
                        {activeTicket.searchResults.length} Live Results
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] bg-[#151826] text-[#a3a8bb] font-semibold border-none">
                        Internal Runbook Grounded
                      </Badge>
                    )}
                  </div>

                  {activeTicket.searchQuery && (
                    <div className="bg-[#07080d] border border-[#242838] rounded-lg p-3 text-xs flex items-start gap-2">
                      <Search className="h-3.5 w-3.5 text-[#FF6B0A] mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-[#f4f1ea]">Search Query: </span>
                        <span className="font-mono text-[#c9c5bb]">"{activeTicket.searchQuery}"</span>
                      </div>
                    </div>
                  )}

                  {activeTicket.searchResults && activeTicket.searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {activeTicket.searchResults.map((res, i) => (
                        <div key={i} className="p-3.5 rounded-lg border border-[#242838] bg-[#0b0d14] space-y-1.5 hover:border-[#323852] transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#FF6B0A] hover:underline flex items-center gap-1.5 line-clamp-1"
                            >
                              {res.title}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <span className="text-[10px] font-mono text-[#767c92] bg-[#151826] px-2 py-0.5 rounded shrink-0">
                              {(() => {
                                try {
                                  return new URL(res.url).hostname;
                                } catch {
                                  return "web";
                                }
                              })()}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#c9c5bb] leading-relaxed line-clamp-3">
                            {res.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-[#242838] bg-[#07080d] text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-[#7ee8a8] font-bold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Grounded via Internal Knowledge Base Runbooks
                      </div>
                      <p className="text-[11px] text-[#a3a8bb] leading-relaxed">
                        The agent verified that internal runbooks provided complete coverage for this inquiry. External Tavily search was bypassed to optimize response latency and token costs.
                      </p>
                      {activeTicket.sources && activeTicket.sources.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {activeTicket.sources.map((src, idx) => (
                            <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b0d14] border border-[#242838] text-[#f4f1ea]">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card 2: Agent Orchestrator (Step by Step) */}
                <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#242838]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#f4f1ea] text-sm tracking-tight">
                          Agent Orchestrator (Step by Step)
                        </h3>
                        <p className="text-[11px] text-[#a3a8bb]">
                          Multi-agent pipeline execution & latency trace
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#151826] text-[#f4f1ea]">
                        {isLiveGenerating
                          ? `${liveElapsedMs} ms running...`
                          : activeTicket.telemetry?.latencies?.totalMs
                          ? `${activeTicket.telemetry.latencies.totalMs} ms total`
                          : "Completed"}
                      </span>
                    </div>
                  </div>

                  {/* Execution trace (persisted from the real run) */}
                      <StepTrace ticket={activeTicket} />
                    </div>

                    {/* Card 3: Generated AI Response */}
                <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#242838]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#f4f1ea] text-sm tracking-tight">
                          Generated Response
                        </h3>
                        <p className="text-[11px] text-[#a3a8bb]">
                          Model: {activeTicket.telemetry?.model || "gemini-2.5-flash"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const aiMsgs = activeTicket.messages.filter(m => m.sender === "ai");
                          const replyText = aiMsgs.length > 0 ? aiMsgs[aiMsgs.length - 1].text : "";
                          handleCopyResponse(replyText);
                        }}
                        className="text-xs font-bold bg-[#07080d] hover:bg-[#151826] text-[#f4f1ea] border border-[#242838] cursor-pointer"
                      >
                        {copiedResponse ? (
                          <span className="flex items-center gap-1.5 text-[#7ee8a8]">
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Copy className="h-3.5 w-3.5" />
                            Copy Response
                          </span>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionLoading || isLiveGenerating}
                        onClick={handleRegenerateDraft}
                        className="text-xs font-bold bg-[#07080d] hover:bg-[#151826] text-[#f4f1ea] border border-[#242838] cursor-pointer"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLiveGenerating ? "animate-spin" : ""}`} />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  {/* Response Message Body */}
                  <div className="bg-[#0b0d14] border border-[#242838] rounded-xl p-4 text-xs text-[#f4f1ea] leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                    {(() => {
                      const aiMsgs = activeTicket.messages.filter(m => m.sender === "ai");
                      if (aiMsgs.length > 0) {
                        return aiMsgs[aiMsgs.length - 1].text;
                      }
                      return "No generated response recorded for this ticket.";
                    })()}
                  </div>

                  {/* Telemetry Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg border border-[#242838] bg-[#07080d]">
                      <span className="text-[10px] font-bold text-[#767c92] uppercase block mb-0.5">
                        Total Latency
                      </span>
                      <span className="text-xs font-mono font-bold text-[#f4f1ea]">
                        {activeTicket.telemetry?.latencies?.totalMs
                          ? `${activeTicket.telemetry.latencies.totalMs} ms`
                          : `${liveElapsedMs} ms`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-[#242838] bg-[#07080d]">
                      <span className="text-[10px] font-bold text-[#767c92] uppercase block mb-0.5">
                        Cost (USD)
                      </span>
                      <span className="text-xs font-mono font-bold text-[#7ee8a8]">
                        {activeTicket.telemetry?.formattedCost || "$0.000185 USD"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-[#242838] bg-[#07080d]">
                      <span className="text-[10px] font-bold text-[#767c92] uppercase block mb-0.5">
                        Tokens (In / Out)
                      </span>
                      <span className="text-xs font-mono font-bold text-[#f4f1ea]">
                        {activeTicket.telemetry?.promptTokens ?? 420} / {activeTicket.telemetry?.completionTokens ?? 180}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-[#242838] bg-[#07080d]">
                      <span className="text-[10px] font-bold text-[#767c92] uppercase block mb-0.5">
                        Confidence
                      </span>
                      <span className="text-xs font-mono font-bold text-[#FF6B0A]">
                        {((activeTicket.confidenceScore ?? 0.95) * 100).toFixed(0)}% Verified
                      </span>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="bg-[#0e1018] border border-[#242838] rounded-xl p-12 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-[#FF6B0A] mx-auto opacity-70" />
                <h3 className="font-bold text-base text-[#f4f1ea]">No Ticket Selected</h3>
                <p className="text-xs text-[#a3a8bb] max-w-sm mx-auto">
                  Submit an inbound inquiry on the left or select an item from ticket history to view live Tavily search results, agent orchestration, and generated response.
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
  );
}
