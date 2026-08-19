import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "aria";
  text: string;
}

const MOCK_KNOWLEDGE_BASE: Record<string, string> = {
  "What does pricing look like?":
    "Plans start at $49/mo for 1,000 AI resolutions. Growth is $149/mo with unlimited channels, and Enterprise is custom with SSO and SLAs. Every plan starts with a 14-day free trial.",
  "Can it escalate to a human?":
    "Absolutely. When confidence drops or a customer asks for a person, I hand off instantly — with the full transcript, sentiment score and a drafted reply, so your team picks up mid-conversation, not from scratch.",
  "How do I reset a password?":
    "To reset your password, click 'Forgot Password' on the login screen or navigate to Settings > Security > Update Credentials. I've also dispatched a secure one-time reset link directly to your registered email.",
  "default":
    "I understand! SupportDesk AI is connected to your live documentation and knowledge base, allowing me to draft accurate, context-aware answers in under 30 seconds or loop in a teammate whenever needed."
};

export default function InteractiveSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: "What does pricing look like?"
    },
    {
      id: "2",
      sender: "aria",
      text: "Plans start at $49/mo for 1,000 AI resolutions. Growth is $149/mo with unlimited channels, and Enterprise is custom with SSO and SLAs. Every plan starts with a 14-day free trial."
    },
    {
      id: "3",
      sender: "user",
      text: "Can it escalate to a human?"
    },
    {
      id: "4",
      sender: "aria",
      text: "Absolutely. When confidence drops or a customer asks for a person, I hand off instantly — with the full transcript, sentiment score and a drafted reply, so your team picks up mid-conversation, not from scratch."
    }
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "How do I reset a password?",
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

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: question
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    const answer = MOCK_KNOWLEDGE_BASE[question] || MOCK_KNOWLEDGE_BASE["default"];

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
            text: answer
          }
        ]);
      } else {
        setStreamingText(answer.slice(0, index));
      }
    }, 25);
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
      {/* Left Column: Eyebrow, Heading, Subtext, Suggestion Chips */}
      <div className="lg:col-span-5 space-y-6">
        <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
          03 — LIVE DEMO
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          Don't take our word for it.{" "}
          <span className="text-violet-400 block mt-1">Interrogate it.</span>
        </h2>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          This is a scripted slice of the real agent experience — instant answers,
          streaming replies, and graceful handoff when things get human.
        </p>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => triggerStreamResponse(chip)}
              disabled={isStreaming}
              className="text-xs font-medium text-slate-300 bg-slate-900/90 border border-slate-800/90 hover:border-violet-500/60 hover:text-white px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Real Sandbox Chat Panel */}
      <div className="lg:col-span-7">
        <div className="w-full rounded-3xl border border-slate-800 bg-[#0B0F19]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700/60" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span>SANDBOX</span>
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
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "rounded-tr-sm bg-slate-800/90 border border-slate-700/50 text-slate-100"
                      : "rounded-tl-sm bg-violet-600 text-white shadow-md shadow-violet-900/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Streaming in-progress message bubble */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-600 px-4 py-2.5 text-white shadow-md shadow-violet-900/20 leading-relaxed flex items-center gap-1">
                  <span>{streamingText}</span>
                  <span className="inline-block w-1.5 h-4 bg-white animate-pulse" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3.5 border-t border-slate-800/80 bg-slate-950/60"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-2 text-xs sm:text-sm">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask the agent something..."
                className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isStreaming}
                className="h-7 w-7 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-violet-600 cursor-pointer"
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
