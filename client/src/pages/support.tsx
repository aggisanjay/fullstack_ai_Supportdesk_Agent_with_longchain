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
  Check, 
  Smile, 
  Meh, 
  Frown, 
  Bot, 
  CheckCircle2, 
  Circle,
  Tag,
  Info
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
  intentCategory?: string;
  intentSummary?: string;
  confidenceScore: number;
  confidenceBreakdown?: string;
  sourceCount: number;
  sources?: string[];
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
  const { user } = useAuth();
  
  // Tab states: "tickets" | "kb" | "analytics" | "playground"
  const [activeTab, setActiveTab] = useState<"tickets" | "kb" | "analytics" | "playground">("tickets");
  
  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Filters & Toggles
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [provider, setProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  
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
  const [playgroundProvider, setPlaygroundProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  const [playgroundResult, setPlaygroundResult] = useState<{ 
    reply: string; 
    sources: string[];
    intentCategory?: string;
    intentSummary?: string;
    confidenceBreakdown?: string;
  } | null>(null);
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

    const res = await apiPost<{ 
      reply: string; 
      sources: string[];
      intentCategory?: string;
      intentSummary?: string;
      confidenceBreakdown?: string;
    }>("/api/support/run", {
      provider: playgroundProvider,
      text: playgroundText
    });

    if (res.ok && res.data) {
      setPlaygroundResult({
        reply: res.data.reply,
        sources: res.data.sources || [],
        intentCategory: res.data.intentCategory,
        intentSummary: res.data.intentSummary,
        confidenceBreakdown: res.data.confidenceBreakdown,
      });
    }
    setPlaygroundLoading(false);
  };

  // Filtered tickets list
  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === "all") return true;
    return t.status === ticketFilter;
  });

  // =========================================================================
  // SEMANTIC BADGES SYSTEM (Zero emoji, distinct and informative)
  // =========================================================================
  const renderIntentBadge = (category?: string) => {
    const cat = category || "general";
    switch (cat) {
      case "technical/integration":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
            <Cpu className="h-3 w-3 text-sky-400" />
            <span>Technical</span>
          </span>
        );
      case "billing":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Tag className="h-3 w-3 text-emerald-400" />
            <span>Billing</span>
          </span>
        );
      case "account/access":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
            <User className="h-3 w-3 text-amber-400" />
            <span>Access</span>
          </span>
        );
      case "bug report":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
            <AlertTriangle className="h-3 w-3 text-rose-400" />
            <span>Bug</span>
          </span>
        );
      case "feature request":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-xs">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>Feature</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-xs">
            <Tag className="h-3 w-3 text-slate-400" />
            <span>General</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
            <Circle className="h-2 w-2 fill-current text-blue-400" />
            <span>Open</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>Pending</span>
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Resolved</span>
          </span>
        );
      case "escalated":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            <span>Escalated</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
            <span>{status}</span>
          </span>
        );
    }
  };

  const renderSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Smile className="h-3 w-3 text-emerald-400" />
            <span>Positive</span>
          </span>
        );
      case "neutral":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-xs">
            <Meh className="h-3 w-3 text-slate-400" />
            <span>Neutral</span>
          </span>
        );
      case "frustrated":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
            <Frown className="h-3 w-3 text-amber-400" />
            <span>Frustrated</span>
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            <span>Critical</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
            <Meh className="h-3 w-3 text-slate-400" />
            <span>Neutral</span>
          </span>
        );
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "faq": return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
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
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
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
        <span className="absolute text-[11px] font-bold text-white font-mono">
          {Math.round(score * 100)}%
        </span>
      </div>
    );
  };

  // Multi-agent progress list steps
  const agentWorkflow = [
    { key: "Intent Agent", label: "Intent Triager", desc: "Classifies ticket topic and customer mood", icon: Cpu },
    { key: "Knowledge Agent", label: "Knowledge Grounder", desc: "Queries internal knowledge base using semantic cosine vectors", icon: Database },
    { key: "Search Agent", label: "Search Agent", desc: "Decides whether live external documentation is required", icon: Globe },
    { key: "Response Agent", label: "Reply Synthesizer", desc: "Synthesizes response with hybrid retrieval confidence calculation", icon: Bot }
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#07090E] flex overflow-hidden relative font-sans text-slate-100">
      
      {/* Left Icon Sidebar */}
      <aside className="w-16 bg-[#090C14] border-r border-slate-800/80 flex flex-col justify-between shrink-0 py-4 items-center z-20">
        <div className="space-y-6 flex flex-col items-center w-full">
          <nav className="flex flex-col gap-2 w-full px-2">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`p-2.5 rounded-xl transition duration-150 relative group flex items-center justify-center cursor-pointer ${
                activeTab === "tickets" 
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
              title="Ticket Queue"
            >
              <Inbox className="h-5 w-5" />
              {tickets.filter(t => t.status !== "resolved").length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#090C14]" />
              )}
              <span className="absolute left-[72px] bg-slate-900 text-slate-200 border border-slate-800 text-[11px] px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium">
                Tickets Queue ({tickets.filter(t => t.status !== "resolved").length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("kb")}
              className={`p-2.5 rounded-xl transition duration-150 relative group flex items-center justify-center cursor-pointer ${
                activeTab === "kb" 
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
              title="Knowledge Base"
            >
              <BookOpen className="h-5 w-5" />
              <span className="absolute left-[72px] bg-slate-900 text-slate-200 border border-slate-800 text-[11px] px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium">
                Knowledge Base
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`p-2.5 rounded-xl transition duration-150 relative group flex items-center justify-center cursor-pointer ${
                activeTab === "analytics" 
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
              title="Analytics"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="absolute left-[72px] bg-slate-900 text-slate-200 border border-slate-800 text-[11px] px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium">
                Analytics
              </span>
            </button>

            <button
              onClick={() => setActiveTab("playground")}
              className={`p-2.5 rounded-xl transition duration-150 relative group flex items-center justify-center cursor-pointer ${
                activeTab === "playground" 
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
              title="Agent Sandbox"
            >
              <Play className="h-5 w-5" />
              <span className="absolute left-[72px] bg-slate-900 text-slate-200 border border-slate-800 text-[11px] px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium">
                Agent Sandbox
              </span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-violet-400 flex items-center justify-center font-bold text-xs select-none">
            {user?.name?.slice(0, 2).toUpperCase() || "SU"}
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex min-w-0 bg-[#07090E] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* Tab 1: TICKETS Queue (Three-panel B2B SaaS Layout)                        */}
        {/* ========================================================================= */}
        {activeTab === "tickets" && (
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            
            {/* Panel 1: Left Ticket List Column ("Active Queue") */}
            <div className="w-[350px] border-r border-slate-800/80 bg-[#090C14] flex flex-col shrink-0 min-h-0">
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#090C14]">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-violet-400" />
                  <h3 className="font-bold text-white text-xs tracking-wider uppercase">
                    Active Queue
                  </h3>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                    {filteredTickets.length}
                  </span>
                </div>
                
                {/* Styled Custom Dropdown */}
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                  className="custom-select saas-input text-xs font-medium rounded-xl py-1.5 pl-3 text-slate-200 cursor-pointer shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              {/* Tickets scroll list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {ticketsLoading ? (
                  <div className="p-10 text-center text-xs text-slate-400 font-mono">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
                    Syncing queue...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400 font-mono italic">
                    Queue is empty.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-3.5 cursor-pointer transition-all duration-150 relative border-l-[3.5px] ${
                          isSelected 
                            ? "bg-[#111624] border-violet-500 shadow-sm" 
                            : "hover:bg-slate-900/40 border-transparent hover:border-slate-800"
                        }`}
                      >
                        {/* Line 1: Ticket ID + Timestamp */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold font-mono text-violet-400 uppercase tracking-tight">
                            {ticket.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* Line 2: Customer message preview */}
                        <h4 className="text-xs font-semibold text-white truncate mt-1.5 tracking-tight leading-snug">
                          {ticket.title}
                        </h4>
                        
                        {/* Line 3: Grouped Status + Intent Category on Left, Confidence + Sentiment on Right */}
                        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {renderStatusBadge(ticket.status)}
                            {renderIntentBadge(ticket.intentCategory)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Confidence Chip */}
                            <span 
                              className="text-[10px] font-bold text-slate-300 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shadow-xs" 
                              title={ticket.confidenceBreakdown || "AI Confidence Score"}
                            >
                              <Sparkles className="h-3 w-3 text-violet-400" />
                              {Math.round(ticket.confidenceScore * 100)}%
                            </span>

                            {/* Sentiment Badge */}
                            {renderSentimentBadge(ticket.sentiment)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Panel 2: Center Conversation Column */}
            <div className="flex-1 flex flex-col bg-[#07090E] min-w-0 min-h-0 border-r border-slate-800/80">
              {activeTicket ? (
                <>
                  {/* Header strip */}
                  <div className="p-3.5 bg-[#090C14] border-b border-slate-800/80 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs bg-violet-600/15 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-md font-mono font-bold shadow-xs">
                          {activeTicket.id}
                        </span>
                        <h2 className="text-sm font-bold text-white truncate">
                          {activeTicket.title}
                        </h2>
                        {renderIntentBadge(activeTicket.intentCategory)}
                        {renderSentimentBadge(activeTicket.sentiment)}
                      </div>
                      
                      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="font-semibold text-slate-200">{activeTicket.customerName}</span>
                          <span className="text-slate-500 font-mono">({activeTicket.customerEmail})</span>
                        </div>

                        {activeTicket.intentSummary && (
                          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px] border-l border-slate-800 pl-3">
                            <Info className="h-3 w-3 text-violet-400 shrink-0" />
                            <span className="truncate max-w-md italic">{activeTicket.intentSummary}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                        Status
                      </span>
                      {/* Styled Status Dropdown */}
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="custom-select saas-input text-xs font-semibold rounded-xl px-3 py-1.5 text-white cursor-pointer shadow-sm"
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
                        <div className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs shadow-md relative ${
                          msg.sender === "customer"
                            ? "saas-card text-slate-200"
                            : msg.sender === "ai"
                              ? "bg-violet-950/30 border border-violet-500/40 text-slate-100 shadow-inner"
                              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-normal"
                        }`}>
                          {msg.sender === "ai" && (
                            <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider select-none border-b border-violet-500/20 pb-1.5">
                              <Bot className="h-3.5 w-3.5 text-violet-400" />
                              <span>AI DRAFT PROPOSAL • AWAITING REVIEW</span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>

                          {msg.sender === "ai" && activeTicket.sources && activeTicket.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-violet-500/20 flex items-center gap-2 flex-wrap text-[11px]">
                              <span className="text-violet-400 font-semibold flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Grounded in:
                              </span>
                              {activeTicket.sources.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-violet-300 hover:text-white underline underline-offset-2 flex items-center gap-1 font-mono text-[10px] bg-violet-950/60 px-2 py-0.5 rounded border border-violet-500/30"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  {url.replace("https://", "").replace("http://", "").split("/")[0]}
                                </a>
                              ))}
                            </div>
                          )}

                          <div className={`text-[10px] text-right mt-2 font-mono ${
                            msg.sender === "agent" ? "text-violet-200" : "text-slate-400"
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer editor box */}
                  <div className="p-4 bg-[#090C14] border-t border-slate-800/80 shrink-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model:</span>
                        {/* Styled Model Selector Dropdown */}
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value as any)}
                          className="custom-select saas-input text-xs rounded-xl py-1.5 pl-3 text-slate-200 cursor-pointer shadow-sm"
                        >
                          <option value="gemini">Google Gemini (Flash)</option>
                          <option value="groq">Groq (LLaMA 3.3 70B)</option>
                          <option value="openai">OpenAI GPT-4o-mini</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleRegenerateDraft}
                        disabled={actionLoading}
                        className="text-xs font-semibold text-violet-400 hover:text-violet-300 disabled:text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${actionLoading ? "animate-spin" : ""}`} />
                        <span>Regenerate Copilot Draft</span>
                      </button>
                    </div>

                    {/* Styled Textarea */}
                    <div className="relative">
                      <textarea
                        value={draftReply}
                        onChange={(e) => setDraftReply(e.target.value)}
                        placeholder="Draft reply or edit copilot proposed resolution..."
                        className="w-full min-h-28 saas-input rounded-2xl p-4 text-xs text-slate-100 placeholder:text-slate-500 resize-y leading-relaxed font-normal shadow-inner"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                      <Button
                        onClick={handleSendResponse}
                        disabled={actionLoading || !draftReply.trim()}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-violet-600/30 cursor-pointer hover:scale-[1.01]"
                      >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Approve & Send Response
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Inbox className="h-10 w-10 text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-300 text-sm">No ticket selected</h3>
                  <p className="text-xs mt-1 max-w-xs text-slate-400">
                    Select a support ticket from the queue list to begin writing responses or auditing copilot drafts.
                  </p>
                </div>
              )}
            </div>

            {/* Panel 3: Right AI Copilot Insights Panel */}
            <div className="w-[330px] bg-[#090C14] overflow-y-auto shrink-0 p-4 space-y-5 min-h-0 flex flex-col">
              {activeTicket ? (
                <>
                  <h3 className="font-bold text-white border-b border-slate-800/80 pb-3 text-xs flex items-center gap-2 shrink-0 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>AI Copilot Insights</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                    
                    {/* Defensible Confidence Index Gauge & Breakdown */}
                    <div className="saas-card rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3.5">
                        {renderConfidenceDial(activeTicket.confidenceScore)}
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Confidence Index
                          </div>
                          <div>
                            {renderSentimentBadge(activeTicket.sentiment)}
                          </div>
                        </div>
                      </div>

                      {/* Real Calculated Breakdown */}
                      <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-300 leading-normal flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <span className="text-slate-400 font-mono text-[10px] leading-relaxed">
                          {activeTicket.confidenceBreakdown || "Hybrid metric: 55% Retrieval grounding quality + 45% LLM self-evaluation."}
                        </span>
                      </div>
                    </div>

                    {/* Orchestration Graph Stepper */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Orchestration Graph
                      </div>

                      <div className="relative border-l-2 border-slate-800 pl-4 ml-2.5 space-y-4 py-1">
                        {agentWorkflow.map((agent, i) => {
                          const matchedLog = activeTicket.workflowSteps?.find(s => s.agent === agent.key);
                          const isActive = !!matchedLog;
                          const AgentIcon = agent.icon;

                          return (
                            <div key={i} className="relative">
                              <span className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 ${
                                isActive 
                                  ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                                  : "bg-slate-950 border-slate-800 text-slate-700"
                              }`}>
                                {isActive && <Check className="h-2 w-2 stroke-[3]" />}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <AgentIcon className={`h-3.5 w-3.5 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                                <span className={`text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-slate-400"}`}>
                                  {agent.label}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-1 leading-relaxed ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                                {isActive ? matchedLog.output : agent.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grounding Matches */}
                    {/* Grounding Matches */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Document Grounding ({activeTicket.sourceCount || activeTicket.sources?.length || 0})
                      </div>
                      
                      {(!activeTicket.sources || activeTicket.sources.length === 0) && activeTicket.sourceCount === 0 ? (
                        <div className="p-3.5 saas-input rounded-xl text-xs text-slate-400 italic">
                          No external sources linked.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeTicket.retrievalStatus === "success" && (
                            <div className="p-3.5 bg-violet-950/20 border border-violet-500/20 rounded-xl space-y-1">
                              <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5" />
                                <span>Knowledge Base Grounding</span>
                              </div>
                              <div className="text-xs text-slate-200 font-medium leading-relaxed">
                                Matched verified documentation via cosine vector indexing.
                              </div>
                            </div>
                          )}

                          {activeTicket.sources && activeTicket.sources.length > 0 && (
                            <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl space-y-2">
                              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5" />
                                <span>Live Web Citations ({activeTicket.sources.length})</span>
                              </div>
                              <ul className="space-y-1.5 text-xs pt-1">
                                {activeTicket.sources.map((url, i) => (
                                  <li key={i} className="break-all">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 text-[11px]"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      {url.replace("https://", "").replace("http://", "").slice(0, 32)}...
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Escalation Protocol */}
                    {activeTicket.status === "escalated" && activeTicket.escalation && (
                      <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3 shadow-lg">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-wider">
                          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
                          <span>Escalation Protocol</span>
                        </div>

                        <div className="text-xs text-rose-200 bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 leading-relaxed">
                          <strong className="block text-rose-300 mb-1">Recommended Response:</strong>
                          <div className="italic text-slate-200 line-clamp-3">
                            {activeTicket.escalation.recommendedResponse}
                          </div>
                          <button 
                            onClick={() => setDraftReply(activeTicket.escalation!.recommendedResponse)}
                            className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-bold block transition cursor-pointer"
                          >
                            Apply Recommendation →
                          </button>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                            Required Actions
                          </span>
                          <ul className="space-y-1.5">
                            {activeTicket.escalation.suggestedActions.map((action, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-rose-200 leading-normal">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-500 p-8 italic flex-1 flex items-center justify-center">
                  Select a ticket to display Diagnostics.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 2: KNOWLEDGE BASE                                                     */}
        {/* ========================================================================= */}
        {activeTab === "kb" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-slate-800/80 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight">Grounding Knowledge Base</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Manage internal documentation, FAQ articles, and runbooks used by Aria for RAG-grounded ticket resolution.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              
              {/* Form panel */}
              <div className="saas-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Plus className="h-4 w-4 text-violet-400" />
                  <span>Upload Article</span>
                </h3>

                {articleMessage && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                    articleMessage.includes("successfully") 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {articleMessage}
                  </div>
                )}

                <form onSubmit={handleAddArticle} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                    <input
                      type="text"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      placeholder="e.g. Password Reset & SSO Troubleshooting"
                      className="w-full saas-input rounded-xl p-3 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value as any })}
                      className="custom-select w-full saas-input rounded-xl p-3 text-white cursor-pointer"
                    >
                      <option value="faq">FAQ</option>
                      <option value="documentation">Product Documentation</option>
                      <option value="internal">Internal Knowledge Base</option>
                      <option value="troubleshooting">Troubleshooting Guide</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content Details</label>
                    <textarea
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      placeholder="Article body, troubleshooting steps, policy rules..."
                      className="w-full min-h-36 saas-input rounded-xl p-3 text-white placeholder:text-slate-500 resize-y leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={kbLoading}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-violet-600/30 cursor-pointer"
                  >
                    Upload Document
                  </Button>
                </form>
              </div>

              {/* Grid panel */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-violet-400" />
                  <span>Indexed Documents ({kbArticles.length})</span>
                </h3>

                <div className="space-y-4">
                  {kbLoading ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
                      Reading repository...
                    </div>
                  ) : kbArticles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                      No documents stored. Create one to enable RAG grounding.
                    </div>
                  ) : (
                    kbArticles.map((art) => (
                      <div 
                        key={art.id}
                        className="saas-card p-5 rounded-2xl flex flex-col justify-between gap-3 relative"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(art.category)}`}>
                              {art.category}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-2 tracking-tight">
                              {art.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {art.content}
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800/60 flex justify-between">
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

        {/* ========================================================================= */}
        {/* Tab 3: ANALYTICS METRICS                                                  */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-slate-800/80 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight">Operations Performance</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Intake volume, autonomous deflection rate, escalation telemetry, and model confidence trends.
              </p>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
                Aggregating telemetry logs...
              </div>
            ) : (
              <>
                {/* 4 Metrics summary boxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="saas-card p-5 rounded-2xl relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Incidents</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{analytics.totalTickets}</div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                      <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                      <span>Ingested volume</span>
                    </div>
                  </div>

                  <div className="saas-card p-5 rounded-2xl relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved SLA</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">{analytics.resolvedTickets}</div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{analytics.totalTickets > 0 ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100) : 0}% auto-close</span>
                    </div>
                  </div>

                  <div className="saas-card p-5 rounded-2xl relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalations</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1.5">{analytics.escalatedTickets}</div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Human loop required</span>
                    </div>
                  </div>

                  <div className="saas-card p-5 rounded-2xl relative overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Avg</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-violet-400 mt-1.5">{Math.round(analytics.averageConfidence * 100)}%</div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      <span>Hybrid grounding score</span>
                    </div>
                  </div>
                </div>

                {/* 2 Visual charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  <div className="saas-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Weekly Resolution Activity</h3>
                    
                    <div className="h-52 w-full flex flex-col justify-between pt-4">
                      <div className="flex-1 flex items-end justify-between gap-3 px-2 border-b border-slate-800 pb-2 relative">
                        {analytics.resolutionTrends.map((trend, idx) => {
                          const maxVal = Math.max(...analytics.resolutionTrends.map(t => t.total), 5);
                          const resolvedHeight = (trend.resolved / maxVal) * 100;
                          const escalatedHeight = (trend.escalated / maxVal) * 100;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                              <div className="w-full flex justify-center gap-1 max-w-[40px] h-32 items-end">
                                <div 
                                  className="w-2.5 bg-emerald-500 rounded-t-sm shadow-xs shadow-emerald-500/20"
                                  style={{ height: `${resolvedHeight}%` }}
                                  title={`Resolved: ${trend.resolved}`}
                                />
                                <div 
                                  className="w-2.5 bg-rose-500 rounded-t-sm shadow-xs shadow-rose-500/20"
                                  style={{ height: `${escalatedHeight}%` }}
                                  title={`Escalated: ${trend.escalated}`}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{trend.date}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                          Resolved
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                          Escalated
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="saas-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Incident Segments</h3>
                    
                    <div className="h-52 flex flex-col justify-center space-y-4 text-xs">
                      {analytics.topIssues.map((issue, idx) => {
                        const totalCounts = analytics.topIssues.reduce((a, b) => a + b.count, 0) || 1;
                        const pct = (issue.count / totalCounts) * 100;

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-white truncate pr-2 text-xs">{issue.name}</span>
                              <span className="font-mono text-slate-300 text-xs shrink-0">{issue.count} tickets</span>
                            </div>
                            <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2">
                              <div 
                                className="bg-violet-500 h-2 rounded-full transition-all duration-300 shadow-xs shadow-violet-500/30"
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

        {/* ========================================================================= */}
        {/* Tab 4: SANDBOX PLAYGROUND                                                 */}
        {/* ========================================================================= */}
        {activeTab === "playground" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
            <div className="border-b border-slate-800/80 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight">Agent Sandbox</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Draft responses manually, run simulations, and inspect grounding URLs outside the live queue.
              </p>
            </div>

            <div className="saas-card p-6 rounded-2xl grid gap-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Engine</label>
                <select
                  value={playgroundProvider}
                  onChange={(e) => setPlaygroundProvider(e.target.value as any)}
                  disabled={playgroundLoading}
                  className="custom-select w-full saas-input rounded-xl p-3 text-white cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Flash)</option>
                  <option value="groq">Groq (LLaMA 3.3 70B)</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulation Input Payload</label>
                <textarea
                  value={playgroundText}
                  onChange={(e) => setPlaygroundText(e.target.value)}
                  disabled={playgroundLoading}
                  placeholder="Paste customer issue or query to run through the orchestration pipeline..."
                  className="min-h-32 w-full saas-input rounded-xl p-3.5 text-white placeholder:text-slate-500 resize-y leading-relaxed font-normal shadow-inner"
                />
              </div>

              <Button 
                onClick={handleRunPlayground}
                disabled={playgroundLoading || !playgroundText.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-violet-600/30 cursor-pointer hover:scale-[1.01]"
              >
                {playgroundLoading ? (
                  <span className="flex items-center justify-center gap-2">
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
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center justify-between font-bold shadow-sm flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Proposed reply compiled successfully.
                  </div>
                  {playgroundResult.intentCategory && renderIntentBadge(playgroundResult.intentCategory)}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Sources panel */}
                  <div className="saas-card p-5 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2.5 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                      <span>Grounding References</span>
                    </h4>
                    
                    {playgroundResult.sources.length === 0 ? (
                      <span className="text-xs text-slate-400 italic block">No external sources referenced.</span>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {playgroundResult.sources.map((src, i) => (
                          <li key={i} className="break-all leading-relaxed">
                            <a 
                              href={src} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {src.replace("https://", "").replace("http://", "").slice(0, 28)}...
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    {playgroundResult.confidenceBreakdown && (
                      <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        {playgroundResult.confidenceBreakdown}
                      </div>
                    )}
                  </div>

                  {/* Reply text */}
                  <div className="md:col-span-2 saas-card p-5 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                      <span>Compiled AI Proposal Reply</span>
                    </h4>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
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
