import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, BookOpen, ExternalLink, Bot } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "aria";
  text: string;
  sources?: string[];
  category?: string;
}

const MOCK_KNOWLEDGE_BASE: Record<string, { reply: string; sources: string[]; category: string }> = {
  "What does pricing look like?": {
    reply: "SupportDesk AI pricing is based on active ticket volume: Standard starts at $49/mo for up to 1,000 resolutions, Growth is $149/mo with full multi-provider configuration, and Enterprise plans offer dedicated instances and custom SLAs.",
    sources: ["https://supportdesk.ai/pricing", "https://supportdesk.ai/docs/plans"],
    category: "billing"
  },
  "Can it escalate to a human?": {
    reply: "Yes, absolutely. When confidence drops below threshold or critical customer sentiment is detected, the agent triggers an automated escalation protocol. It passes the full ticket history, intent summary, and suggested next actions to your human team.",
    sources: ["https://supportdesk.ai/docs/escalation-protocols"],
    category: "technical/integration"
  },
  "How do I reset an OAuth client secret?": {
    reply: "To rotate or generate a new client secret in Scalekit, navigate to Admin Dashboard > API Settings > Client Credentials. Select 'Generate New Secret' and store it immediately in your server environment variables.",
    sources: ["https://docs.scalekit.com/credentials"],
    category: "account/access"
  },
  "default": {
    reply: "SupportDesk AI is connected to your live documentation and knowledge base runbooks. It categorizes inquiries, searches relevant docs, and synthesizes structured resolution drafts in seconds.",
    sources: ["https://supportdesk.ai/docs/overview"],
    category: "general"
  }
};

export default function InteractiveSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: "How do I reset an OAuth client secret?"
    },
    {
      id: "2",
      sender: "aria",
      text: "To rotate or generate a new client secret in Scalekit, navigate to Admin Dashboard > API Settings > Client Credentials. Select 'Generate New Secret' and store it immediately in your server environment variables.",
      sources: ["https://docs.scalekit.com/credentials"],
      category: "account/access"
    }
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "How do I reset an OAuth client secret?",
    "What does pricing look like?",
    "Can it escalate to a human?"
  ];

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const triggerStreamResponse = (question: string) => {
    if (isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: question
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    const answerData = MOCK_KNOWLEDGE_BASE[question] || MOCK_KNOWLEDGE_BASE["default"];
    const answer = answerData.reply;

    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index >= answer.length) {
        clearInterval(interval);
        setStreamingText("");
        setIsStreaming(false);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "aria",
            text: answer,
            sources: answerData.sources,
            category: answerData.category
          }
        ]);
      } else {
        setStreamingText(answer.slice(0, index));
      }
    }, 20);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;
    const text = inputVal.trim();
    setInputVal("");
    triggerStreamResponse(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      {/* Left Column */}
      <div className="lg:col-span-5 space-y-5">
        <div className="text-xs font-bold tracking-widest text-[#FF6B0A] uppercase">
          INTERACTIVE DEMO
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1916] leading-[1.15]">
          Try the AI copilot{" "}
          <span className="text-[#FF6B0A] block mt-1">in real-time.</span>
        </h2>

        <p className="text-[#6D665F] text-sm sm:text-base leading-relaxed">
          Test realistic inquiries below to observe how the assistant classifies intent, references source documentation, and streams answers.
        </p>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => triggerStreamResponse(chip)}
              disabled={isStreaming}
              className="text-xs font-medium text-[#1C1916] bg-[#FFFDFA] border border-[#E7DFD5] hover:border-[#FF6B0A] hover:bg-[#FFF0E4] px-3.5 py-2 rounded-full transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Sandbox Chat Panel */}
      <div className="lg:col-span-7">
        <div className="w-full rounded-2xl border border-[#E7DFD5] bg-[#FFFDFA] shadow-lg overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E7DFD5] px-5 py-3 bg-[#F8F5F0]">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E7DFD5]" />
              <span className="text-xs font-bold text-[#1C1916] ml-2">Sandbox Simulation</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E85B00] bg-[#FFF0E4] px-2.5 py-0.5 rounded-full border border-[#FFD8BF]">
              <Sparkles className="h-3 w-3 text-[#FF6B0A]" />
              <span>Grounded Demo</span>
            </div>
          </div>

          {/* Chat message thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "rounded-tr-sm bg-[#1C1916] text-white"
                      : "rounded-tl-sm bg-[#FFFDFA] border border-[#E7DFD5] text-[#1C1916]"
                  }`}
                >
                  {msg.sender === "aria" && (
                    <div className="flex items-center justify-between gap-2 border-b border-[#E7DFD5] pb-1.5 mb-2">
                      <span className="text-[10px] font-bold text-[#FF6B0A] uppercase tracking-wider flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        AI Copilot Draft
                      </span>
                      {msg.category && (
                        <span className="text-[10px] bg-[#FFF0E4] text-[#E85B00] px-1.5 py-0.2 rounded font-mono">
                          {msg.category}
                        </span>
                      )}
                    </div>
                  )}

                  <div>{msg.text}</div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#E7DFD5] flex items-center gap-2 flex-wrap text-[10px] text-[#6D665F]">
                      <span className="font-semibold flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-[#FF6B0A]" /> Sources:
                      </span>
                      {msg.sources.map((src, i) => (
                        <span key={i} className="bg-[#F0EBE3] px-1.5 py-0.5 rounded border border-[#E7DFD5] text-[#1C1916] flex items-center gap-1 font-mono">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {src.replace("https://", "").replace("http://", "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#FFFDFA] border border-[#E7DFD5] px-4 py-3 text-[#1C1916] leading-relaxed flex items-center gap-1 shadow-xs">
                  <span>{streamingText}</span>
                  <span className="inline-block w-1.5 h-4 bg-[#FF6B0A] animate-pulse" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-[#E7DFD5] bg-[#F8F5F0]"
          >
            <div className="flex items-center gap-2 rounded-xl bg-[#FFFDFA] border border-[#E7DFD5] px-3.5 py-2 text-xs sm:text-sm shadow-inner">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask sample customer query..."
                className="flex-1 bg-transparent text-[#1C1916] placeholder:text-[#8A8279] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isStreaming}
                className="h-7 w-7 rounded-lg bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
