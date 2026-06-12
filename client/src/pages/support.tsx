import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  BookOpen, 
  BarChart3, 
  Play, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  LogOut, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ExternalLink, 
  FileText,
  Globe,
  Database,
  Cpu,
  Clock,
  User,
  ShieldAlert,
  Check
} from "lucide-react";

// Interfaces matching database structures
interface KBArticle {
  id: string;
  title: string;
  category: "faq" | "documentation" | "internal" | "troubleshooting";
  content: string;
  createdAt: string;
}

interface TicketMessage {
  id: string;
  sender: "customer" | "agent" | "ai";
  text: string;
  createdAt: string;
}

interface WorkflowStep {
  agent: string;
  status: "completed" | "failed" | "pending";
  output: string;
}

interface EscalationInfo {
  recommendedResponse: string;
  suggestedActions: string[];
}

interface Ticket {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  status: "open" | "pending" | "resolved" | "escalated";
  sentiment: "positive" | "neutral" | "frustrated" | "critical";
  confidenceScore: number;
  sourceCount: number;
  retrievalStatus: "success" | "none" | "failed";
  messages: TicketMessage[];
  workflowSteps: WorkflowStep[];
  escalation?: EscalationInfo;
  createdAt: string;
}

interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  openTickets: number;
  averageConfidence: number;
  topIssues: { name: string; count: number }[];
  resolutionTrends: { date: string; resolved: number; escalated: number; total: number }[];
}

export default function Support() {
  const { logout, user } = useAuth();
  
  // Tab states: "tickets" | "kb" | "analytics" | "playground"
  const [activeTab, setActiveTab] = useState<"tickets" | "kb" | "analytics" | "playground">("tickets");
  
  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Filters & Toggles
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [provider, setProvider] = useState<"openai" | "gemini">("gemini");
  
  // Loading states
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Editor state (reply draft)
  const [draftReply, setDraftReply] = useState("");
  
  // Form states
  const [newArticle, setNewArticle] = useState({ title: "", category: "faq", content: "" });
  const [articleMessage, setArticleMessage] = useState("");
  
  // Playground states
  const [playgroundText, setPlaygroundText] = useState("");
  const [playgroundProvider, setPlaygroundProvider] = useState<"openai" | "gemini">("gemini");
  const [playgroundResult, setPlaygroundResult] = useState<{ reply: string; sources: string[] } | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Load ticket data
  const loadTickets = async (selectFirst = false) => {
    setTicketsLoading(true);
    const res = await apiGet<Ticket[]>("/api/support/tickets");
    if (res.ok && Array.isArray(res.data)) {
      setTickets(res.data);
      if (selectFirst && res.data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(res.data[0].id);
      }
    }
    setTicketsLoading(false);
  };

  // Load KB articles
  const loadKb = async () => {
    setKbLoading(true);
    const res = await apiGet<KBArticle[]>("/api/support/kb");
    if (res.ok && Array.isArray(res.data)) {
      setKbArticles(res.data);
    }
    setKbLoading(false);
  };

  // Load Analytics
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const res = await apiGet<AnalyticsData>("/api/support/analytics");
    if (res.ok && res.data) {
      setAnalytics(res.data);
    }
    setAnalyticsLoading(false);
  };

  // Initial loading
  useEffect(() => {
    loadTickets(true);
    loadKb();
    loadAnalytics();
  }, []);

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  // Sync draft reply with AI draft reply if new message comes in
  useEffect(() => {
    if (activeTicket) {
      const aiMsgs = activeTicket.messages.filter(m => m.sender === "ai");
      if (aiMsgs.length > 0) {
        setDraftReply(aiMsgs[aiMsgs.length - 1].text);
      } else {
        setDraftReply("");
      }
    } else {
      setDraftReply("");
    }
  }, [selectedTicketId, tickets]);

  // Run AI draft response
  const handleRegenerateDraft = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    
    const customerMsgs = activeTicket.messages.filter(m => m.sender === "customer");
    const lastMsgText = customerMsgs.length > 0 ? customerMsgs[customerMsgs.length - 1].text : activeTicket.title;

    const res = await apiPost<any>("/api/support/run", {
      provider,
      text: lastMsgText,
      ticketId: activeTicket.id
    });

    if (res.ok && res.data) {
      await loadTickets();
      await loadAnalytics();
    }
    setActionLoading(true); // temporary lock toggled off via reload state
    setActionLoading(false);
  };

  // Send human response to customer
  const handleSendResponse = async () => {
    if (!activeTicket || !draftReply.trim()) return;
    setActionLoading(true);

    const res = await apiPatch<Ticket>(`/api/support/tickets/${activeTicket.id}`, {
      status: "resolved"
    });

    if (res.ok) {
      await apiPost<any>("/api/support/run", {
        provider,
        text: `[AGENT RESPONSE] ${draftReply}`,
        ticketId: activeTicket.id
      });
      
      await apiPatch(`/api/support/tickets/${activeTicket.id}`, { status: "resolved" });

      setDraftReply("");
      await loadTickets();
      await loadAnalytics();
    }
    setActionLoading(false);
  };

  // Update status directly
  const handleStatusChange = async (newStatus: "open" | "pending" | "resolved" | "escalated") => {
    if (!activeTicket) return;
    const res = await apiPatch<Ticket>(`/api/support/tickets/${activeTicket.id}`, {
      status: newStatus
    });
    if (res.ok) {
      await loadTickets();
      await loadAnalytics();
    }
  };

  // Add KB Article
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) {
      setArticleMessage("Please fill out all fields.");
      return;
    }

    const res = await apiPost<KBArticle>("/api/support/kb", newArticle);
    if (res.ok) {
      setNewArticle({ title: "", category: "faq", content: "" });
      setArticleMessage("Article added successfully!");
      await loadKb();
      setTimeout(() => setArticleMessage(""), 3000);
    } else {
      setArticleMessage("Failed to add article.");
    }
  };

  // Delete KB Article
  const handleDeleteArticle = async (id: string) => {
    const res = await apiDelete(`/api/support/kb/${id}`);
    if (res.ok) {
      await loadKb();
    }
  };

  // Run Playground
  const handleRunPlayground = async () => {
    if (!playgroundText.trim()) return;
    setPlaygroundLoading(true);
    setPlaygroundResult(null);

    const res = await apiPost<{ reply: string; sources: string[] }>("/api/support/run", {
      provider: playgroundProvider,
      text: playgroundText
    });

    if (res.ok && res.data) {
      setPlaygroundResult({
        reply: res.data.reply,
        sources: res.data.sources || []
      });
    }
    setPlaygroundLoading(false);
  };

  // Filtered tickets list
  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === "all") return true;
    return t.status === ticketFilter;
  });

  // Priorities helper based on sentiment
  const getPriorityLabel = (sentiment: string) => {
    switch (sentiment) {
      case "critical": return "Urgent";
      case "frustrated": return "High";
      case "neutral": return "Medium";
      case "positive": return "Low";
      default: return "Medium";
    }
  };

  const getPriorityStyle = (sentiment: string) => {
    switch (sentiment) {
      case "critical": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "frustrated": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "neutral": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "positive": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "pending": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "resolved": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "escalated": return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5";
      case "neutral": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "frustrated": return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5";
      case "critical": return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10 shadow-lg";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "faq": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "documentation": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "internal": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "troubleshooting": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Circular confidence SVG ring dial
  const renderConfidenceDial = (score: number) => {
    const radius = 22;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score * circumference);

    return (
      <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* background circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* active score indicator circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={score >= 0.8 ? "#10b981" : score >= 0.6 ? "#eab308" : "#f43f5e"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-slate-100 font-mono">
          {Math.round(score * 100)}%
        </span>
      </div>
    );
  };

  // Multi-agent progress list steps
  const agentWorkflow = [
    { key: "Intent Agent", label: "Intent Triager", icon: Cpu },
    { key: "Knowledge Agent", label: "Knowledge Grounder", icon: Database },
    { key: "Search Agent", label: "Tavily Search Grounder", icon: Globe },
    { key: "Response Agent", label: "Reply Synthesizer", icon: Sparkles }
  ];

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 flex border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Tab Navigation Menu Panel */}
      <aside className="w-[72px] bg-slate-950 border-r border-slate-900 flex flex-col justify-between shrink-0 py-6 items-center">
        <div className="space-y-8 flex flex-col items-center w-full">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <Sparkles className="h-4 w-4" />
          </div>
          
          <nav className="flex flex-col gap-3.5 w-full px-2">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`p-3 rounded-xl transition duration-150 relative group flex items-center justify-center ${
                activeTab === "tickets" 
                  ? "bg-slate-900 text-indigo-400 border border-slate-800" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
              }`}
              title="Ticket inbox workspace"
            >
              <Inbox className="h-5 w-5" />
              {tickets.filter(t => t.status !== "resolved").length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
              )}
              <span className="absolute left-[80px] bg-slate-900 text-slate-200 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
                Tickets Queue ({tickets.filter(t => t.status !== "resolved").length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("kb")}
              className={`p-3 rounded-xl transition duration-150 relative group flex items-center justify-center ${
                activeTab === "kb" 
                  ? "bg-slate-900 text-indigo-400 border border-slate-800" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
              }`}
              title="Knowledge base documents"
            >
              <BookOpen className="h-5 w-5" />
              <span className="absolute left-[80px] bg-slate-900 text-slate-200 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
                Knowledge Base
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`p-3 rounded-xl transition duration-150 relative group flex items-center justify-center ${
                activeTab === "analytics" 
                  ? "bg-slate-900 text-indigo-400 border border-slate-800" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
              }`}
              title="Analytics dashboard metrics"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="absolute left-[80px] bg-slate-900 text-slate-200 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
                Analytics Dashboard
              </span>
            </button>

            <button
              onClick={() => setActiveTab("playground")}
              className={`p-3 rounded-xl transition duration-150 relative group flex items-center justify-center ${
                activeTab === "playground" 
                  ? "bg-slate-900 text-indigo-400 border border-slate-800" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
              }`}
              title="Agent Sandbox Playground"
            >
              <Play className="h-5 w-5" />
              <span className="absolute left-[80px] bg-slate-900 text-slate-200 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
                Agent Sandbox
              </span>
            </button>
          </nav>
        </div>

        {/* Profile Card Footing */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 flex items-center justify-center font-bold text-xs select-none">
            {user?.name?.slice(0, 2).toUpperCase() || "SU"}
          </div>
          <button 
            onClick={logout}
            className="p-2.5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 rounded-xl transition duration-150"
            title="Log Out Session"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Panel Content Box */}
      <main className="flex-1 flex min-w-0 bg-slate-900/40">
        
        {/* Tab 1: TICKETS Queue (Three-panel layout) */}
        {activeTab === "tickets" && (
          <div className="flex-1 flex min-h-0 relative">
            
            {/* Panel 1: List Column (Queue) */}
            <div className="w-[340px] border-r border-slate-900/80 bg-slate-950 flex flex-col shrink-0 min-h-0">
              <div className="p-4 border-b border-slate-900 flex items-center justify-between shrink-0 bg-slate-950">
                <h3 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                  <Inbox className="h-4 w-4 text-slate-400" />
                  Active Queue
                </h3>
                
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                  className="text-[11px] bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 font-medium text-slate-300 outline-none cursor-pointer hover:border-slate-700 transition"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              {/* Tickets scroll area */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 bg-slate-950/60">
                {ticketsLoading ? (
                  <div className="p-10 text-center text-xs text-slate-500 font-mono">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Syncing queue...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 font-mono italic">
                    Queue is empty.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-4 cursor-pointer transition-all duration-200 relative border-l-[3.5px] ${
                        selectedTicketId === ticket.id 
                          ? "bg-slate-900/75 border-indigo-500 border-b border-slate-850" 
                          : "hover:bg-slate-900/25 border-transparent hover:border-slate-800 border-b border-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold font-mono text-indigo-400/80 uppercase">
                          {ticket.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-600" />
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-semibold text-slate-200 truncate mt-1.5 tracking-tight">
                        {ticket.title}
                      </h4>
                      
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="flex gap-1">
                          {/* Priority badge based on sentiment */}
                          <span className={`text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border uppercase ${getPriorityStyle(ticket.sentiment)}`}>
                            {getPriorityLabel(ticket.sentiment)}
                          </span>
                          {/* Status badge */}
                          <span className={`text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border uppercase ${getStatusStyle(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Sentiment */}
                          <span className="text-xs" title={`Sentiment: ${ticket.sentiment}`}>
                            {ticket.sentiment === "positive" && "😊"}
                            {ticket.sentiment === "neutral" && "😐"}
                            {ticket.sentiment === "frustrated" && "😰"}
                            {ticket.sentiment === "critical" && "🚨"}
                          </span>
                          
                          {/* Confidence */}
                          <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-0.5" title="Confidence Score">
                            <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                            {Math.round(ticket.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel 2: Conversation View Column (Center) */}
            <div className="flex-1 flex flex-col bg-slate-900/10 min-w-0 min-h-0">
              {activeTicket ? (
                <>
                  {/* Active Header strip */}
                  <div className="p-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                          {activeTicket.id}
                        </span>
                        <h2 className="text-xs font-bold text-slate-200 truncate">
                          {activeTicket.title}
                        </h2>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-300">{activeTicket.customerName}</span>
                        <span className="text-slate-600 font-mono">({activeTicket.customerEmail})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Status</span>
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="escalated">Escalated</option>
                      </select>
                    </div>
                  </div>

                  {/* Message scroll log */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {activeTicket.messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "customer" 
                            ? "justify-start" 
                            : "justify-end"
                        }`}
                      >
                        <div className={`max-w-[85%] sm:max-w-xl rounded-xl p-3.5 text-xs shadow-sm relative ${
                          msg.sender === "customer"
                            ? "bg-slate-950 border border-slate-900 text-slate-200"
                            : msg.sender === "ai"
                              ? "bg-indigo-950/10 border border-dashed border-indigo-500/20 text-slate-200 shadow-inner"
                              : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10 font-normal"
                        }`}>
                          {msg.sender === "ai" && (
                            <div className="absolute top-2 right-3.5 flex items-center gap-1 text-[8px] font-bold text-indigo-400 uppercase tracking-widest select-none">
                              <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                              AI Draft Proposal
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                          <div className={`text-[9px] text-right mt-2 font-mono ${
                            msg.sender === "agent" ? "text-indigo-200" : "text-slate-500"
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer editor box */}
                  <div className="p-4 bg-slate-950 border-t border-slate-900 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model:</span>
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value as any)}
                          className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="openai">OpenAI GPT-4o-mini</option>
                          <option value="gemini">Gemini 3 Flash Preview</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleRegenerateDraft}
                        disabled={actionLoading}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 flex items-center gap-1 transition"
                      >
                        <RefreshCw className={`h-3 w-3 ${actionLoading ? "animate-spin" : ""}`} />
                        Regenerate Copilot Draft
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={draftReply}
                        onChange={(e) => setDraftReply(e.target.value)}
                        placeholder="Draft reply or edit copilot proposed resolution..."
                        className="w-full min-h-24 bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500 resize-y"
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-3">
                      <Button
                        onClick={handleSendResponse}
                        disabled={actionLoading || !draftReply.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send Response
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <Inbox className="h-8 w-8 text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-400 text-sm">No ticket selected</h3>
                  <p className="text-xs mt-1 max-w-xs text-slate-500">
                    Select a support ticket from the queue list to begin writing responses or auditing copilot drafts.
                  </p>
                </div>
              )}
            </div>

            {/* Panel 3: AI Insights / Diagnostics Panel (Right) */}
            <div className="w-[300px] bg-slate-950 border-l border-slate-900/80 overflow-y-auto shrink-0 p-4 space-y-6 min-h-0 flex flex-col">
              {activeTicket ? (
                <>
                  <h3 className="font-bold text-slate-100 border-b border-slate-900 pb-3 text-xs flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    AI Copilot Insights
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                    
                    {/* Score / Sentiment Card */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/40 border border-slate-850">
                      {renderConfidenceDial(activeTicket.confidenceScore)}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Confidence Index
                        </div>
                        <div className={`text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded border inline-flex items-center gap-1 ${getSentimentStyle(activeTicket.sentiment)}`}>
                          {activeTicket.sentiment === "positive" && "😊"}
                          {activeTicket.sentiment === "neutral" && "😐"}
                          {activeTicket.sentiment === "frustrated" && "😰"}
                          {activeTicket.sentiment === "critical" && "🚨"}
                          <span className="capitalize">{activeTicket.sentiment} Mood</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline workflow step details */}
                    <div className="space-y-3.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Orchestration Graph
                      </div>

                      <div className="relative border-l border-slate-800 pl-4.5 ml-2 space-y-5 py-1">
                        {agentWorkflow.map((agent, i) => {
                          const matchedLog = activeTicket.workflowSteps?.find(s => s.agent === agent.key);
                          const isActive = !!matchedLog;
                          const AgentIcon = agent.icon;

                          return (
                            <div key={i} className="relative">
                              <span className={`absolute -left-[23.5px] top-1.5 h-3 w-3 rounded-full flex items-center justify-center border ${
                                isActive 
                                  ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                                  : "bg-slate-950 border-slate-800 text-slate-600"
                              }`}>
                                <Check className="h-2 w-2" />
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <AgentIcon className={`h-3 w-3 ${isActive ? "text-indigo-400" : "text-slate-600"}`} />
                                <span className={`text-[11px] font-semibold tracking-tight ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                                  {agent.label}
                                </span>
                              </div>
                              <p className={`text-[10px] mt-1 leading-normal ${isActive ? "text-slate-400" : "text-slate-600"}`}>
                                {isActive ? matchedLog.output : "Pending step execution..."}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grounding Matches */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Document Grounding ({activeTicket.sourceCount})
                      </div>
                      
                      {activeTicket.sourceCount === 0 ? (
                        <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-900 text-[10px] text-slate-500 italic">
                          No sources linked.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* KB Articles */}
                          {activeTicket.retrievalStatus === "success" && (
                            <div className="p-3 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-1.5">
                              <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                Knowledge Base Hits
                              </div>
                              <div className="text-[10px] text-slate-300 font-medium leading-relaxed">
                                Matched internal documents base.
                              </div>
                            </div>
                          )}

                          {/* Web Sources */}
                          {activeTicket.messages.some(m => m.sender === "ai" && m.text.includes("http")) && (
                            <div className="p-3 bg-sky-950/10 border border-sky-900/30 rounded-xl space-y-1.5">
                              <div className="text-[8px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Web Grounding Results
                              </div>
                              <div className="text-[10px] text-slate-400 leading-relaxed font-mono truncate">
                                Tavily references used.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Escalation recommendations box */}
                    {activeTicket.status === "escalated" && activeTicket.escalation && (
                      <div className="p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
                          Escalation Protocol
                        </div>

                        <div className="text-[10px] text-rose-200 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 leading-relaxed">
                          <strong>Escalated response draft:</strong>
                          <div className="italic mt-1.5 text-slate-400 line-clamp-3">
                            {activeTicket.escalation.recommendedResponse}
                          </div>
                          <button 
                            onClick={() => setDraftReply(activeTicket.escalation!.recommendedResponse)}
                            className="mt-2 text-[9px] text-indigo-400 hover:text-indigo-300 font-bold block"
                          >
                            Apply Recommendation
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                            Required Checklists
                          </span>
                          <ul className="space-y-1.5">
                            {activeTicket.escalation.suggestedActions.map((action, i) => (
                              <li key={i} className="flex items-start gap-2 text-[10px] text-rose-200 leading-normal">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-600 p-8 italic flex-1 flex items-center justify-center">
                  Select a ticket to display Diagnostics.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: KNOWLEDGE BASE */}
        {activeTab === "kb" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-slate-900 pb-5">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Grounding Knowledge Articles</h1>
              <p className="text-xs text-slate-500 mt-1.5">
                Manage references, system details, and troubleshooting notes that AI Copilot matches to user tickets.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              
              {/* Form panel */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Plus className="h-4 w-4 text-indigo-400" />
                  Upload Article
                </h3>

                {articleMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                    articleMessage.includes("successfully") 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {articleMessage}
                  </div>
                )}

                <form onSubmit={handleAddArticle} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                    <input
                      type="text"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      placeholder="e.g. Okta SSO Configuration Setup"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="faq">FAQ</option>
                      <option value="documentation">Product Documentation</option>
                      <option value="internal">Internal Knowledge Base</option>
                      <option value="troubleshooting">Troubleshooting Guide</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Content Details</label>
                    <textarea
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      placeholder="Markdown content, error logs, configuration codes..."
                      className="w-full min-h-32 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={kbLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    Upload Document
                  </Button>
                </form>
              </div>

              {/* Grid panel */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Indexed Documents ({kbArticles.length})
                </h3>

                <div className="space-y-4">
                  {kbLoading ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-indigo-500" />
                      Reading repository...
                    </div>
                  ) : kbArticles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No documents stored. Create one to enable RAG grounding.
                    </div>
                  ) : (
                    kbArticles.map((art) => (
                      <div 
                        key={art.id}
                        className="bg-slate-950 p-5 rounded-xl border border-slate-900 shadow-sm flex flex-col justify-between gap-3 relative"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${getCategoryColor(art.category)}`}>
                              {art.category}
                            </span>
                            <h4 className="text-xs font-bold text-slate-200 mt-2 tracking-tight">
                              {art.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 rounded-lg transition"
                            title="Remove document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {art.content}
                        </p>
                        <div className="text-[9px] text-slate-600 font-mono pt-2 border-t border-slate-900/60 flex justify-between">
                          <span>DOC_ID: {art.id}</span>
                          <span>Indexed {new Date(art.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: ANALYTICS METRICS */}
        {activeTab === "analytics" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-slate-900 pb-5">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Operations Performance</h1>
              <p className="text-xs text-slate-500 mt-1.5">
                Intake volumes, auto-resolution logs, SLA escalations, and grounding diagnostics.
              </p>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                Aggregating system logs...
              </div>
            ) : (
              <>
                {/* Metrics boxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 relative overflow-hidden group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Incidents</div>
                    <div className="text-2xl font-extrabold text-slate-100 mt-1">{analytics.totalTickets}</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                      <TrendingUp className="h-3 w-3 text-indigo-400" />
                      Lifetime ingestion count
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 relative overflow-hidden group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolved SLA</div>
                    <div className="text-2xl font-extrabold text-emerald-500 mt-1">{analytics.resolvedTickets}</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {analytics.totalTickets > 0 ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100) : 0}% auto-close rate
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 relative overflow-hidden group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Escalations</div>
                    <div className="text-2xl font-extrabold text-rose-500 mt-1">{analytics.escalatedTickets}</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      Active integration issues
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 relative overflow-hidden group">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence Avg</div>
                    <div className="text-2xl font-extrabold text-indigo-400 mt-1">{Math.round(analytics.averageConfidence * 100)}%</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      Grounding quality index
                    </div>
                  </div>
                </div>

                {/* SVG Visual charts */}
                <div className="grid md:grid-cols-2 gap-8">
                  
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Weekly Activity Flow</h3>
                    
                    <div className="h-52 w-full flex flex-col justify-between pt-4">
                      <div className="flex-1 flex items-end justify-between gap-3 px-2 border-b border-slate-800 pb-2 relative">
                        
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                          <div className="w-full border-t border-slate-700" />
                          <div className="w-full border-t border-slate-700" />
                          <div className="w-full border-t border-slate-700" />
                        </div>

                        {analytics.resolutionTrends.map((trend, idx) => {
                          const maxVal = Math.max(...analytics.resolutionTrends.map(t => t.total), 5);
                          const resolvedHeight = (trend.resolved / maxVal) * 100;
                          const escalatedHeight = (trend.escalated / maxVal) * 100;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                              <div className="w-full flex justify-center gap-1 max-w-[40px] h-32 items-end">
                                <div 
                                  className="w-2.5 bg-emerald-500 rounded-t-sm"
                                  style={{ height: `${resolvedHeight}%` }}
                                  title={`Resolved: ${trend.resolved}`}
                                />
                                <div 
                                  className="w-2.5 bg-rose-500 rounded-t-sm"
                                  style={{ height: `${escalatedHeight}%` }}
                                  title={`Escalated: ${trend.escalated}`}
                                />
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono">{trend.date}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-center gap-5 text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
                          Resolved
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
                          Escalated
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Top Incident Segments</h3>
                    
                    <div className="h-52 flex flex-col justify-center space-y-4.5 text-xs">
                      {analytics.topIssues.map((issue, idx) => {
                        const totalCounts = analytics.topIssues.reduce((a, b) => a + b.count, 0) || 1;
                        const pct = (issue.count / totalCounts) * 100;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-slate-300 truncate pr-2 tracking-tight text-[11px]">{issue.name}</span>
                              <span className="font-mono text-slate-500 text-[10px] shrink-0">{issue.count} tickets</span>
                            </div>
                            <div className="w-full bg-slate-900 border border-slate-850 rounded-full h-2">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300 shadow-xs shadow-indigo-500/20"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 4: SANDBOX PLAYGROUND */}
        {activeTab === "playground" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
            <div className="border-b border-slate-900 pb-5">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Agent Sandbox</h1>
              <p className="text-xs text-slate-500 mt-1.5">
                Draft responses manually, run simulations, and inspect grounding URLs outside the queue.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 grid gap-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Engine</label>
                <select
                  value={playgroundProvider}
                  onChange={(e) => setPlaygroundProvider(e.target.value as any)}
                  disabled={playgroundLoading}
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-slate-200 outline-none cursor-pointer"
                >
                  <option value="openai">OpenAI GPT-4o-mini</option>
                  <option value="gemini">Google Gemini 1.5 Flash</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulation Input Payload</label>
                <textarea
                  value={playgroundText}
                  onChange={(e) => setPlaygroundText(e.target.value)}
                  disabled={playgroundLoading}
                  placeholder="Paste issue ticket to analyze..."
                  className="min-h-32 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-200 outline-none resize-y"
                />
              </div>

              <Button 
                onClick={handleRunPlayground}
                disabled={playgroundLoading || !playgroundText.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-indigo-600/10 cursor-pointer animate-none"
              >
                {playgroundLoading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Executing Multi-Agent Orchestration...
                  </span>
                ) : (
                  "Run Grounded Simulation"
                )}
              </Button>
            </div>

            {playgroundResult && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle className="h-4 w-4" />
                  Proposed reply compiled successfully.
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Sources panel */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      Grounding References
                    </h4>
                    
                    {playgroundResult.sources.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic block">No external sources references.</span>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {playgroundResult.sources.map((src, i) => (
                          <li key={i} className="break-all leading-relaxed">
                            <a 
                              href={src} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {src.replace("https://", "").replace("http://", "").slice(0, 30)}...
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Reply text */}
                  <div className="md:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                      Compiled AI Proposal Reply
                    </h4>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {playgroundResult.reply}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
