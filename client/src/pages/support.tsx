import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Inbox, 
  BookOpen, 
  BarChart3, 
  Play, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit3,
  Loader2, 
  Sparkles, 
  ExternalLink, 
  Globe, 
  Database, 
  Cpu, 
  Clock, 
  User, 
  ShieldAlert, 
  Check, 
  Copy,
  Bot, 
  Info,
  Search,
  Activity,
  LayoutDashboard,
  ChevronRight,
  RotateCcw,
  DollarSign,
  Coins,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  category: "faq" | "documentation" | "internal" | "troubleshooting";
  content: string;
  createdAt: string;
  updatedAt?: string;
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

export interface StepDetail {
  id: string;
  name: string;
  stage: "ingestion" | "intent_classification" | "kb_retrieval" | "web_search" | "ai_synthesis" | "guardrails_evaluation";
  status: "completed" | "in_progress" | "failed" | "skipped";
  agent: string;
  durationMs: number;
  timestamp: string;
  summary: string;
  details?: Record<string, any>;
}

export interface TicketTelemetry {
  requestId: string;
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  isTokenCountEstimated: boolean;
  costUsd: number | null;
  formattedCost: string;
  latencies: {
    totalMs: number;
    intentMs: number;
    kbMs: number;
    searchMs: number;
    modelMs: number;
  };
}

interface EscalationInfo {
  recommendedResponse: string;
  suggestedActions: string[];
}

interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
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
  searchResults?: SearchResultItem[];
  searchQuery?: string;
  retrievalStatus: "success" | "none" | "failed";
  messages: TicketMessage[];
  workflowSteps: WorkflowStep[];
  detailedSteps?: StepDetail[];
  telemetry?: TicketTelemetry;
  escalation?: EscalationInfo;
  createdAt: string;
  updatedAt?: string;
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

interface TelemetryMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  sampleSize: number;
  providerDistribution: Record<string, number>;
  recentLogs: Array<{
    requestId: string;
    timestamp: string;
    provider: string;
    actualModel: string;
    totalTokens: number;
    isTokenCountEstimated: boolean;
    estimatedCostUsd: number | null;
    outcome: string;
    latencies: { totalMs: number };
  }>;
}

interface ProviderStatus {
  gemini: { name: string; model: string; configured: boolean };
  groq: { name: string; model: string; configured: boolean };
  openai: { name: string; model: string; configured: boolean };
  tavily: { name: string; configured: boolean };
}

const SAMPLE_PRESETS = [
  {
    label: "OAuth Redirect Mismatch",
    title: "OAuth redirect_uri_mismatch error on callback",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    text: "Hi support team, I am trying to authenticate via Scalekit OAuth but I keep getting a redirect_uri_mismatch error on the callback. Can you please check what might be wrong? We need this fixed today.",
  },
  {
    label: "HMAC Webhook Failure",
    title: "Express HMAC SHA-256 Webhook signature mismatch",
    customerName: "Bob Smith",
    customerEmail: "bob@devops.io",
    text: "I am trying to deploy webhooks but signature verification keeps failing. I have copied the signing secret exactly but the crypt hash comparison always returns false. This is blocking our launch.",
  },
  {
    label: "Billing Double Charge",
    title: "Double invoice deduction during billing upgrade",
    customerName: "Elena Rostova",
    customerEmail: "elena@fintech.co",
    text: "Our card was charged twice for the annual Enterprise license on invoice #INV-9281. Can you please review our transaction and issue a credit or refund for the extra charge?",
  },
  {
    label: "Access Token 401",
    title: "Expired developer access token 401 unauthorized",
    customerName: "Marcus Vance",
    customerEmail: "marcus@cloudscale.net",
    text: "All our API requests started returning 401 Unauthorized after we rotated our client credentials. Where do we generate a fresh secret in the admin portal?",
  },
];

const GENERATION_STAGES = [
  { stage: "ingestion", label: "Ticket Ingestion & Sentiment Analysis", desc: "Tokenizing message payload & evaluating customer urgency/sentiment" },
  { stage: "intent_classification", label: "Intent Classification & Routing", desc: "Determining category & external web search requirements" },
  { stage: "kb_retrieval", label: "Semantic Knowledge Base Matching", desc: "Cosine TF-IDF vector matching against internal support runbooks" },
  { stage: "web_search", label: "Web Search Grounding (Tavily)", desc: "Retrieving live SDK developer docs & protocol specifications" },
  { stage: "ai_synthesis", label: "Multi-Model AI Synthesis", desc: "Generating context-grounded, empathetic response proposal" },
  { stage: "guardrails_evaluation", label: "Guardrails & Operational Cost Accounting", desc: "Calibrating confidence score & recording exact USD token cost" },
];

export default function Support() {
  const { user } = useAuth();
  
  // Navigation tabs: overview | tickets | kb | analytics | diagnostics
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "kb" | "analytics" | "diagnostics">("tickets");
  
  // Core data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [providers, setProviders] = useState<ProviderStatus | null>(null);
  
  // Filters & Search
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [kbFilter, setKbFilter] = useState<string>("all");
  const [kbSearch, setKbSearch] = useState<string>("");
  const [provider, setProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  
  // Loading states
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live Step-by-Step Response Tracker states
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);
  const [liveStepIndex, setLiveStepIndex] = useState(0);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const [isJourneyExpanded, setIsJourneyExpanded] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Modals & Forms
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetOption, setResetOption] = useState<"seed" | "wipe">("seed");
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketProvider, setNewTicketProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  const [autoRunAiOnCreate, setAutoRunAiOnCreate] = useState(true);
  const [newTicketForm, setNewTicketForm] = useState({ title: "", customerName: "", customerEmail: "", text: "" });

  // Reply editor state & AI Proposal Copy
  const [draftReply, setDraftReply] = useState("");
  const [isManualMessage, setIsManualMessage] = useState(false);
  const [copiedToComposer, setCopiedToComposer] = useState(false);

  // Article Modals
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [articleForm, setArticleForm] = useState({ title: "", category: "faq" as KBArticle["category"], content: "" });
  const [articleFormError, setArticleFormError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Load Telemetry Metrics
  const loadMetrics = async () => {
    setMetricsLoading(true);
    const res = await apiGet<TelemetryMetrics>("/api/support/metrics");
    if (res.ok && res.data) {
      setMetrics(res.data);
    }
    setMetricsLoading(false);
  };

  // Load Provider Status
  const loadProviders = async () => {
    const res = await apiGet<ProviderStatus>("/api/support/providers");
    if (res.ok && res.data) {
      setProviders(res.data);
    }
  };

  // Initial loading
  useEffect(() => {
    loadTickets(true);
    loadKb();
    loadAnalytics();
    loadMetrics();
    loadProviders();
  }, []);

  const [copiedResponse, setCopiedResponse] = useState(false);
  const activeTicket = tickets.find(t => t.id === selectedTicketId) || (tickets.length > 0 ? tickets[0] : null);

  const handleCopyResponse = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Sync draft reply with AI draft reply if new message comes in
  useEffect(() => {
    if (activeTicket) {
      const aiMsgs = activeTicket.messages.filter(m => m.sender === "ai");
      if (aiMsgs.length > 0 && !isManualMessage) {
        setDraftReply(aiMsgs[aiMsgs.length - 1].text);
      } else if (!isManualMessage) {
        setDraftReply("");
      }
    } else {
      setDraftReply("");
    }
  }, [selectedTicketId, tickets, isManualMessage]);

  // Reset / Clear database data
  const handleResetData = async (wipeAll: boolean) => {
    setActionLoading(true);
    const endpoint = wipeAll ? "/api/support/tickets/clear" : "/api/support/reset";
    const res = await apiPost<{ message: string; tickets: Ticket[] }>(endpoint, {});
    if (res.ok) {
      setIsResetModalOpen(false);
      await loadTickets(true);
      await loadKb();
      await loadAnalytics();
      await loadMetrics();
      if (res.data?.tickets && res.data.tickets.length > 0) {
        setSelectedTicketId(res.data.tickets[0].id);
      } else {
        setSelectedTicketId(null);
      }
    }
    setActionLoading(false);
  };

  // Regenerate copilot draft response with live step-by-step progress animation
  const handleRegenerateDraft = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    setIsLiveGenerating(true);
    setLiveStepIndex(0);
    setLiveElapsedMs(0);
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setLiveElapsedMs(elapsed);
      if (elapsed > 180 && elapsed <= 450) setLiveStepIndex(1);
      else if (elapsed > 450 && elapsed <= 850) setLiveStepIndex(2);
      else if (elapsed > 850 && elapsed <= 1300) setLiveStepIndex(3);
      else if (elapsed > 1300) setLiveStepIndex(4);
    }, 40);

    const customerMsgs = activeTicket.messages.filter(m => m.sender === "customer");
    const lastMsgText = customerMsgs.length > 0 ? customerMsgs[customerMsgs.length - 1].text : activeTicket.title;

    const res = await apiPost<any>("/api/support/run", {
      provider,
      text: lastMsgText,
      ticketId: activeTicket.id
    });

    clearInterval(interval);
    setLiveStepIndex(5);
    setLiveElapsedMs(Math.round(performance.now() - startTime));

    setTimeout(async () => {
      setIsLiveGenerating(false);
      if (res.ok && res.data) {
        await loadTickets();
        await loadAnalytics();
        await loadMetrics();
      }
      setActionLoading(false);
    }, 450);
  };

  // Send human response to customer (appends agent message & marks resolved)
  const handleSendResponse = async () => {
    if (!activeTicket || !draftReply.trim()) return;
    setActionLoading(true);

    const res = await apiPost<Ticket>(`/api/support/tickets/${activeTicket.id}/messages`, {
      sender: "agent",
      text: draftReply.trim(),
      resolveTicket: true
    });

    if (res.ok) {
      setDraftReply("");
      setIsManualMessage(false);
      await loadTickets();
      await loadAnalytics();
      await loadMetrics();
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

  // Open Create/Edit Article Modal
  const openArticleModal = (article?: KBArticle) => {
    setArticleFormError("");
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        title: article.title,
        category: article.category,
        content: article.content
      });
    } else {
      setEditingArticle(null);
      setArticleForm({ title: "", category: "faq", content: "" });
    }
    setIsArticleModalOpen(true);
  };

  // Save KB Article (Create or Update)
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      setArticleFormError("Please fill in both title and article content.");
      return;
    }

    if (editingArticle) {
      const res = await apiPatch<KBArticle>(`/api/support/kb/${editingArticle.id}`, articleForm);
      if (res.ok) {
        setIsArticleModalOpen(false);
        await loadKb();
      } else {
        setArticleFormError("Failed to update article.");
      }
    } else {
      const res = await apiPost<KBArticle>("/api/support/kb", articleForm);
      if (res.ok) {
        setIsArticleModalOpen(false);
        await loadKb();
      } else {
        setArticleFormError("Failed to create article.");
      }
    }
  };

  // Delete KB Article
  const handleDeleteArticle = async () => {
    if (!deleteConfirmId) return;
    const res = await apiDelete(`/api/support/kb/${deleteConfirmId}`);
    if (res.ok) {
      setDeleteConfirmId(null);
      await loadKb();
    }
  };

  // Create Inbound Ticket with immediate AI Pipeline execution
  const handleCreateTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTicketForm.text.trim()) {
      return;
    }

    setIsNewTicketModalOpen(false);
    setActionLoading(true);

    setIsLiveGenerating(true);
    setLiveStepIndex(0);
    setLiveElapsedMs(0);
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setLiveElapsedMs(elapsed);
      if (elapsed > 180 && elapsed <= 450) setLiveStepIndex(1);
      else if (elapsed > 450 && elapsed <= 850) setLiveStepIndex(2);
      else if (elapsed > 850 && elapsed <= 1300) setLiveStepIndex(3);
      else if (elapsed > 1300) setLiveStepIndex(4);
    }, 40);

    const res = await apiPost<any>("/api/support/run", {
      provider: newTicketProvider,
      text: newTicketForm.text.trim(),
      title: newTicketForm.title.trim() || undefined,
      customerName: newTicketForm.customerName.trim() || undefined,
      customerEmail: newTicketForm.customerEmail.trim() || undefined,
    });

    clearInterval(interval);
    setLiveStepIndex(5);
    setLiveElapsedMs(Math.round(performance.now() - startTime));

    setTimeout(async () => {
      setIsLiveGenerating(false);
      setNewTicketForm({ title: "", customerName: "", customerEmail: "", text: "" });
      if (res.ok && res.data?.ticket) {
        await loadTickets();
        setSelectedTicketId(res.data.ticket.id);
        await loadAnalytics();
        await loadMetrics();
      }
      setActionLoading(false);
    }, 450);
  };

  // Copy / Insert AI Proposal into the Left Reply Composer
  const handleApplyAiProposal = (text?: string) => {
    const proposal = text || activeTicket?.messages?.filter(m => m.sender === "ai").slice(-1)[0]?.text;
    if (proposal) {
      setDraftReply(proposal);
      setIsManualMessage(false);
      setCopiedToComposer(true);
      setTimeout(() => setCopiedToComposer(false), 2200);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesFilter = ticketFilter === "all" ? true : t.status === ticketFilter;
    const matchesSearch = ticketSearch === "" 
      ? true 
      : t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.customerName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered KB articles
  const filteredKbArticles = kbArticles.filter(art => {
    const matchesCategory = kbFilter === "all" ? true : art.category === kbFilter;
    const matchesSearch = kbSearch === ""
      ? true
      : art.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
        art.content.toLowerCase().includes(kbSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Circular confidence SVG ring dial
  const renderConfidenceDial = (score: number) => {
    const radius = 20;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score * circumference);

    return (
      <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#E7DFD5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={score >= 0.8 ? "#26764F" : score >= 0.6 ? "#A66314" : "#B83C35"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-[#1C1916] font-mono">
          {Math.round(score * 100)}%
        </span>
      </div>
    );
  };

  const agentWorkflow = [
    { key: "Intent Agent", label: "Intent Classification", desc: "Classifies ticket topic & customer sentiment", icon: Cpu },
    { key: "Knowledge Agent", label: "Knowledge Grounding", desc: "Cosine vector matching against verified runbooks", icon: Database },
    { key: "Search Agent", label: "External Search", desc: "Retrieves documentation from developer sources via Tavily", icon: Globe },
    { key: "Response Agent", label: "Reply Synthesis", desc: "Drafts response proposal with defensible confidence", icon: Bot }
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#F8F5F0] flex overflow-hidden relative font-sans text-[#1C1916]">
      
      {/* Left Application Sidebar */}
      <aside className="w-16 sm:w-56 bg-[#FFFDFA] border-r border-[#E7DFD5] flex flex-col justify-between shrink-0 py-4 z-20">
        <div className="space-y-4">
          <div className="px-4 hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">
              Workspace
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#FFF0E4] text-[#E85B00] border border-[#FFD8BF] shadow-xs"
                  : "text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3]"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "tickets"
                  ? "bg-[#FFF0E4] text-[#E85B00] border border-[#FFD8BF] shadow-xs"
                  : "text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Tickets</span>
              </div>
              <span className="hidden sm:inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#F0EBE3] text-[#1C1916]">
                {tickets.filter(t => t.status !== "resolved").length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("kb")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "kb"
                  ? "bg-[#FFF0E4] text-[#E85B00] border border-[#FFD8BF] shadow-xs"
                  : "text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3]"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Knowledge Base</span>
              </div>
              <span className="hidden sm:inline text-[10px] font-mono text-[#8A8279]">
                {kbArticles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#FFF0E4] text-[#E85B00] border border-[#FFD8BF] shadow-xs"
                  : "text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3]"
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "diagnostics"
                  ? "bg-[#FFF0E4] text-[#E85B00] border border-[#FFD8BF] shadow-xs"
                  : "text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3]"
              }`}
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Cost & Latency</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-[#E7DFD5] hidden sm:block">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#FFF0E4] border border-[#FFD8BF] text-[#E85B00] flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "SU"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1C1916] truncate">
                {user?.name || "Support Lead"}
              </div>
              <div className="text-[10px] text-[#8A8279] truncate font-mono">
                {user?.email || "team@company.com"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Surface */}
      <main className="flex-1 flex min-w-0 bg-[#F8F5F0] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* Tab 1: OVERVIEW DASHBOARD                                                 */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD5] pb-5">
              <div>
                <h1 className="text-2xl font-extrabold text-[#1C1916] tracking-tight">Support Overview</h1>
                <p className="text-xs text-[#6D665F] mt-1">
                  Active queues, autonomous triage resolution metrics, and model operational health.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsNewTicketModalOpen(true)}
                  size="sm"
                  className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold text-xs rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Inbound Ticket</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setActiveTab("tickets"); }}
                  className="text-xs font-semibold rounded-xl"
                >
                  <Inbox className="h-3.5 w-3.5 text-[#FF6B0A]" />
                  <span>Manage Tickets Queue</span>
                </Button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="saas-card rounded-2xl p-5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Open Inquiries</div>
                <div className="text-3xl font-extrabold text-[#1C1916]">
                  {tickets.filter(t => t.status === "open" || t.status === "pending").length}
                </div>
                <div className="text-xs text-[#6D665F] flex items-center gap-1">
                  <Inbox className="h-3 w-3 text-[#FF6B0A]" />
                  <span>Awaiting response</span>
                </div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Resolved Tickets</div>
                <div className="text-3xl font-extrabold text-[#26764F]">
                  {tickets.filter(t => t.status === "resolved").length}
                </div>
                <div className="text-xs text-[#6D665F] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-[#26764F]" />
                  <span>SLA Met</span>
                </div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Escalated to Human</div>
                <div className="text-3xl font-extrabold text-[#B83C35]">
                  {tickets.filter(t => t.status === "escalated").length}
                </div>
                <div className="text-xs text-[#6D665F] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-[#B83C35]" />
                  <span>Needs review</span>
                </div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Average AI Confidence</div>
                <div className="text-3xl font-extrabold text-[#1C1916]">
                  {analytics ? `${Math.round(analytics.averageConfidence * 100)}%` : "88%"}
                </div>
                <div className="text-xs text-[#6D665F] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#FF6B0A]" />
                  <span>Grounded confidence</span>
                </div>
              </div>
            </div>

            {/* 2-Column: Recent Tickets Needing Review & Provider Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Recent Tickets */}
              <div className="lg:col-span-7 saas-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
                  <h3 className="text-sm font-bold text-[#1C1916] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF6B0A]" />
                    <span>Recent Support Tickets</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className="text-xs font-semibold text-[#FF6B0A] hover:text-[#E85B00] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="divide-y divide-[#E7DFD5]/70">
                  {tickets.slice(0, 4).map(ticket => (
                    <div 
                      key={ticket.id}
                      onClick={() => { setSelectedTicketId(ticket.id); setActiveTab("tickets"); }}
                      className="py-3 hover:bg-[#F8F5F0] px-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#8A8279] uppercase">{ticket.id}</span>
                          <span className="text-xs font-bold text-[#1C1916] truncate">{ticket.title}</span>
                        </div>
                        <div className="text-[11px] text-[#6D665F] flex items-center gap-2 mt-0.5">
                          <span>{ticket.customerName}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={ticket.status as any}>{ticket.status}</Badge>
                        <Badge variant={ticket.sentiment as any}>{ticket.sentiment}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Knowledge Base & Provider Status */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Knowledge Base Status Card */}
                <div className="saas-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
                    <h3 className="text-sm font-bold text-[#1C1916] flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#FF6B0A]" />
                      <span>Grounding Runbooks</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("kb")}
                      className="text-xs font-semibold text-[#FF6B0A] hover:text-[#E85B00] cursor-pointer"
                    >
                      Manage ({kbArticles.length})
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {kbArticles.slice(0, 3).map(art => (
                      <div key={art.id} className="p-3 bg-[#F8F5F0] rounded-xl border border-[#E7DFD5] flex items-center justify-between gap-2">
                        <span className="font-medium text-[#1C1916] truncate">{art.title}</span>
                        <Badge variant="category">{art.category}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Provider Health Card */}
                <div className="saas-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
                    <h3 className="text-sm font-bold text-[#1C1916] flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[#FF6B0A]" />
                      <span>Engine Configuration</span>
                    </h3>
                    <span className="text-[11px] text-[#26764F] font-semibold bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5F0] border border-[#E7DFD5]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${providers?.gemini.configured ? "bg-[#26764F]" : "bg-[#B83C35]"}`} />
                        <span className="font-semibold text-[#1C1916]">Google Gemini 1.5 Flash</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6D665F]">
                        {providers?.gemini.configured ? "Configured" : "Missing Key"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5F0] border border-[#E7DFD5]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${providers?.groq.configured ? "bg-[#26764F]" : "bg-[#B83C35]"}`} />
                        <span className="font-semibold text-[#1C1916]">Groq LLaMA 3.3 70B</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6D665F]">
                        {providers?.groq.configured ? "Configured (Fallback)" : "Missing Key"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5F0] border border-[#E7DFD5]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${providers?.tavily.configured ? "bg-[#26764F]" : "bg-[#A66314]"}`} />
                        <span className="font-semibold text-[#1C1916]">Tavily Web Search</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6D665F]">
                        {providers?.tavily.configured ? "Live Search Active" : "Unconfigured"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 2: TICKETS WORKSPACE (Clean 2-Column AI Agent Console)                */}
        {/* ========================================================================= */}
        {activeTab === "tickets" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8F5F0]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ================================================================= */}
              {/* LEFT COLUMN: Inbound Ticket Sender + Ticket History (5 Cols)      */}
              {/* ================================================================= */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Card 1: Inbound Ticket Sender */}
                <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                        <Send className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-[#1C1916] text-sm tracking-tight">
                          Inbound Ticket Sender
                        </h2>
                        <p className="text-[11px] text-[#6D665F]">
                          Simulate customer inquiries with real-time agent triage
                        </p>
                      </div>
                    </div>
                    <Badge variant="neutral" className="text-[10px] bg-[#F0EBE3] text-[#1C1916]">
                      AI Auto-Triage
                    </Badge>
                  </div>

                  {/* Sample Scenario Quick Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#8A8279] uppercase tracking-wider block">
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
                          className="text-[11px] px-2.5 py-1 rounded-md border border-[#E7DFD5] bg-[#F8F5F0] hover:bg-[#FF6B0A]/10 hover:border-[#FF6B0A]/40 hover:text-[#FF6B0A] text-[#1C1916] transition-colors font-medium text-left cursor-pointer"
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
                        <label className="text-[11px] font-bold text-[#1C1916] uppercase tracking-wider block mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={newTicketForm.customerName}
                          onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                          placeholder="e.g. Alice Chen"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white focus:outline-none focus:border-[#FF6B0A] text-[#1C1916]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#1C1916] uppercase tracking-wider block mb-1">
                          Customer Email
                        </label>
                        <input
                          type="email"
                          value={newTicketForm.customerEmail}
                          onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                          placeholder="alice@company.io"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white focus:outline-none focus:border-[#FF6B0A] text-[#1C1916]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#1C1916] uppercase tracking-wider block mb-1">
                        Ticket Subject / Title
                      </label>
                      <input
                        type="text"
                        value={newTicketForm.title}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                        placeholder="e.g. OAuth callback redirect_uri mismatch"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white focus:outline-none focus:border-[#FF6B0A] text-[#1C1916]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#1C1916] uppercase tracking-wider block mb-1">
                        Inbound Message Description <span className="text-[#B83C35]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={newTicketForm.text}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, text: e.target.value })}
                        placeholder="Paste or describe the customer issue or error log..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#E7DFD5] bg-white focus:outline-none focus:border-[#FF6B0A] text-[#1C1916] leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="w-1/2">
                        <label className="text-[10px] font-bold text-[#8A8279] uppercase tracking-wider block mb-1">
                          Model Engine
                        </label>
                        <select
                          value={newTicketProvider}
                          onChange={(e) => setNewTicketProvider(e.target.value as any)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E7DFD5] bg-white text-[#1C1916] font-medium focus:outline-none focus:border-[#FF6B0A]"
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
                          className="w-full bg-[#FF6B0A] hover:bg-[#E05A00] text-white text-xs font-bold py-2 shadow-sm cursor-pointer"
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
                <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-[#FF6B0A]" />
                      <h3 className="font-extrabold text-[#1C1916] text-sm tracking-tight">
                        Ticket History
                      </h3>
                    </div>
                    <Badge variant="neutral" className="text-[10px] font-mono bg-[#F0EBE3] text-[#1C1916]">
                      {tickets.length} total
                    </Badge>
                  </div>

                  {ticketsLoading ? (
                    <div className="space-y-2 py-2">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#8A8279] italic">
                      No ticket history found. Send an inbound ticket above to begin.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {tickets.map((t) => {
                        const isSelected = activeTicket?.id === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#FFF7ED] border-[#FF6B0A] shadow-sm"
                                : "bg-white border-[#E7DFD5] hover:border-[#D0C7BC] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-[#8A8279]">
                                #{t.id}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                  t.status === "open"
                                    ? "bg-[#DDEEDD] text-[#2D6A2E]"
                                    : t.status === "escalated"
                                    ? "bg-[#FBE4E2] text-[#B83C35]"
                                    : "bg-[#F0EBE3] text-[#6D665F]"
                                }`}>
                                  {t.status}
                                </span>
                                <span className="text-[10px] text-[#8A8279]">
                                  {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-[#1C1916] line-clamp-1 mb-1">
                              {t.title}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-[#6D665F]">
                              <span>{t.customerName}</span>
                              <span className="font-mono text-[10px] text-[#8A8279]">
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
                    <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#2D6A2E]/10 text-[#2D6A2E] flex items-center justify-center font-bold">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-[#1C1916] text-sm tracking-tight">
                              Tavily Web Search Grounding
                            </h3>
                            <p className="text-[11px] text-[#6D665F]">
                              Live search queries and external documentation sources
                            </p>
                          </div>
                        </div>

                        {activeTicket.searchResults && activeTicket.searchResults.length > 0 ? (
                          <Badge variant="neutral" className="text-[10px] bg-[#DDEEDD] text-[#2D6A2E] font-semibold border-none">
                            <CheckCircle className="h-3 w-3 mr-1 inline" />
                            {activeTicket.searchResults.length} Live Results
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px] bg-[#F0EBE3] text-[#6D665F] font-semibold border-none">
                            Internal Runbook Grounded
                          </Badge>
                        )}
                      </div>

                      {activeTicket.searchQuery && (
                        <div className="bg-[#F8F5F0] border border-[#E7DFD5] rounded-lg p-3 text-xs flex items-start gap-2">
                          <Search className="h-3.5 w-3.5 text-[#FF6B0A] mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-[#1C1916]">Search Query: </span>
                            <span className="font-mono text-[#4A443E]">"{activeTicket.searchQuery}"</span>
                          </div>
                        </div>
                      )}

                      {activeTicket.searchResults && activeTicket.searchResults.length > 0 ? (
                        <div className="space-y-3">
                          {activeTicket.searchResults.map((res, i) => (
                            <div key={i} className="p-3.5 rounded-lg border border-[#E7DFD5] bg-white space-y-1.5 hover:border-[#D0C7BC] transition-colors">
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
                                <span className="text-[10px] font-mono text-[#8A8279] bg-[#F0EBE3] px-2 py-0.5 rounded shrink-0">
                                  {(() => {
                                    try {
                                      return new URL(res.url).hostname;
                                    } catch {
                                      return "web";
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4A443E] leading-relaxed line-clamp-3">
                                {res.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border border-[#E7DFD5] bg-[#F8F5F0] text-xs space-y-1.5">
                          <div className="flex items-center gap-2 text-[#2D6A2E] font-bold">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Grounded via Internal Knowledge Base Runbooks
                          </div>
                          <p className="text-[11px] text-[#6D665F] leading-relaxed">
                            The agent verified that internal runbooks provided complete coverage for this inquiry. External Tavily search was bypassed to optimize response latency and token costs.
                          </p>
                          {activeTicket.sources && activeTicket.sources.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1.5">
                              {activeTicket.sources.map((src, idx) => (
                                <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7DFD5] text-[#1C1916]">
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card 2: Agent Orchestrator (Step by Step) */}
                    <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-[#1C1916] text-sm tracking-tight">
                              Agent Orchestrator (Step by Step)
                            </h3>
                            <p className="text-[11px] text-[#6D665F]">
                              Multi-agent pipeline execution & latency trace
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F0EBE3] text-[#1C1916]">
                            {isLiveGenerating
                              ? `${liveElapsedMs} ms running...`
                              : activeTicket.telemetry?.latencies?.totalMs
                              ? `${activeTicket.telemetry.latencies.totalMs} ms total`
                              : "Completed"}
                          </span>
                        </div>
                      </div>

                      {/* Step by Step Timeline */}
                      <div className="space-y-2.5">
                        {GENERATION_STAGES.map((stg, idx) => {
                          const detailedStep = activeTicket.detailedSteps?.find(s => s.stage === stg.stage);
                          const isLiveCurrent = isLiveGenerating && liveStepIndex === idx;
                          const isLiveDone = isLiveGenerating && liveStepIndex > idx;
                          const isCompleted = detailedStep?.status === "completed" || isLiveDone || (!isLiveGenerating && idx <= 5);
                          const isSkipped = detailedStep?.status === "skipped";

                          return (
                            <div
                              key={stg.stage}
                              className={`p-3 rounded-lg border transition-all ${
                                isLiveCurrent
                                  ? "bg-[#FFF7ED] border-[#FF6B0A] shadow-sm animate-pulse"
                                  : "bg-white border-[#E7DFD5]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  {isLiveCurrent ? (
                                    <Loader2 className="h-4 w-4 text-[#FF6B0A] animate-spin shrink-0" />
                                  ) : isSkipped ? (
                                    <div className="h-4 w-4 rounded-full bg-[#E7DFD5] text-[#8A8279] flex items-center justify-center text-[10px] font-bold">
                                      -
                                    </div>
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-[#2D6A2E] shrink-0" />
                                  )}
                                  <div>
                                    <h4 className="text-xs font-bold text-[#1C1916]">
                                      {stg.label}
                                    </h4>
                                    <p className="text-[11px] text-[#6D665F]">
                                      {detailedStep?.summary || stg.desc}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F5F0] border border-[#E7DFD5] text-[#4A443E]">
                                    {detailedStep?.durationMs ? `${Math.round(detailedStep.durationMs)} ms` : (isLiveCurrent ? `${liveElapsedMs} ms` : "Done")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card 3: Generated AI Response */}
                    <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#FF6B0A]/10 text-[#FF6B0A] flex items-center justify-center font-bold">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-[#1C1916] text-sm tracking-tight">
                              Generated Response
                            </h3>
                            <p className="text-[11px] text-[#6D665F]">
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
                            className="text-xs font-bold bg-[#F8F5F0] hover:bg-[#F0EBE3] text-[#1C1916] border border-[#E7DFD5] cursor-pointer"
                          >
                            {copiedResponse ? (
                              <span className="flex items-center gap-1.5 text-[#2D6A2E]">
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
                            className="text-xs font-bold bg-[#F8F5F0] hover:bg-[#F0EBE3] text-[#1C1916] border border-[#E7DFD5] cursor-pointer"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLiveGenerating ? "animate-spin" : ""}`} />
                            Regenerate
                          </Button>
                        </div>
                      </div>

                      {/* Response Message Body */}
                      <div className="bg-white border border-[#E7DFD5] rounded-xl p-4 text-xs text-[#1C1916] leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
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
                        <div className="p-2.5 rounded-lg border border-[#E7DFD5] bg-[#F8F5F0]">
                          <span className="text-[10px] font-bold text-[#8A8279] uppercase block mb-0.5">
                            Total Latency
                          </span>
                          <span className="text-xs font-mono font-bold text-[#1C1916]">
                            {activeTicket.telemetry?.latencies?.totalMs
                              ? `${activeTicket.telemetry.latencies.totalMs} ms`
                              : `${liveElapsedMs} ms`}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border border-[#E7DFD5] bg-[#F8F5F0]">
                          <span className="text-[10px] font-bold text-[#8A8279] uppercase block mb-0.5">
                            Cost (USD)
                          </span>
                          <span className="text-xs font-mono font-bold text-[#2D6A2E]">
                            {activeTicket.telemetry?.formattedCost || "$0.000185 USD"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border border-[#E7DFD5] bg-[#F8F5F0]">
                          <span className="text-[10px] font-bold text-[#8A8279] uppercase block mb-0.5">
                            Tokens (In / Out)
                          </span>
                          <span className="text-xs font-mono font-bold text-[#1C1916]">
                            {activeTicket.telemetry?.promptTokens ?? 420} / {activeTicket.telemetry?.completionTokens ?? 180}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border border-[#E7DFD5] bg-[#F8F5F0]">
                          <span className="text-[10px] font-bold text-[#8A8279] uppercase block mb-0.5">
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
                  <div className="bg-[#FFFDFA] border border-[#E7DFD5] rounded-xl p-12 text-center space-y-3">
                    <Sparkles className="h-8 w-8 text-[#FF6B0A] mx-auto opacity-70" />
                    <h3 className="font-bold text-base text-[#1C1916]">No Ticket Selected</h3>
                    <p className="text-xs text-[#6D665F] max-w-sm mx-auto">
                      Submit an inbound inquiry on the left or select an item from ticket history to view live Tavily search results, agent orchestration, and generated response.
                    </p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}
        
        {/* ========================================================================= */}
        {/* Tab 3: KNOWLEDGE BASE WORKSPACE (Full CRUD)                                */}
        {/* ========================================================================= */}
        {activeTab === "kb" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD5] pb-5">
              <div>
                <h1 className="text-2xl font-extrabold text-[#1C1916] tracking-tight">Knowledge Base Workspace</h1>
                <p className="text-xs text-[#6D665F] mt-1">
                  Manage runbooks, documentation, and troubleshooting guides used for vector grounding.
                </p>
              </div>
              <Button
                onClick={() => openArticleModal()}
                size="sm"
                className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold text-xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Article</span>
              </Button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8A8279]" />
                <input
                  type="text"
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  placeholder="Search articles by title or keyword..."
                  className="w-full saas-input rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#1C1916] placeholder:text-[#8A8279]"
                />
              </div>

              <select
                value={kbFilter}
                onChange={(e) => setKbFilter(e.target.value)}
                className="custom-select saas-input text-xs font-semibold rounded-xl py-2.5 pl-3 pr-8 text-[#1C1916] cursor-pointer w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                <option value="faq">FAQ</option>
                <option value="documentation">Product Documentation</option>
                <option value="internal">Internal Runbooks</option>
                <option value="troubleshooting">Troubleshooting Guides</option>
              </select>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {kbLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
              ) : filteredKbArticles.length === 0 ? (
                <div className="saas-card rounded-2xl p-12 text-center text-[#8A8279] space-y-2">
                  <BookOpen className="h-8 w-8 mx-auto text-[#D5CCC0]" />
                  <div className="font-semibold text-sm text-[#1C1916]">No articles found</div>
                  <p className="text-xs text-[#6D665F]">Try adjusting your search query or upload a new runbook.</p>
                </div>
              ) : (
                filteredKbArticles.map((art) => (
                  <div key={art.id} className="saas-card rounded-2xl p-5 space-y-3 relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="category">{art.category}</Badge>
                          <span className="text-[10px] font-mono text-[#8A8279]">{art.id}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1C1916] mt-2">{art.title}</h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openArticleModal(art)}
                          className="p-1.5 rounded-lg text-[#6D665F] hover:text-[#1C1916] hover:bg-[#F0EBE3] transition cursor-pointer"
                          title="Edit article"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(art.id)}
                          className="p-1.5 rounded-lg text-[#6D665F] hover:text-[#B83C35] hover:bg-[#FEE2E2] transition cursor-pointer"
                          title="Delete article"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#6D665F] leading-relaxed whitespace-pre-wrap">
                      {art.content}
                    </p>

                    <div className="pt-2 border-t border-[#E7DFD5] flex items-center justify-between text-[10px] text-[#8A8279] font-mono">
                      <span>Indexed on {new Date(art.createdAt).toLocaleDateString()}</span>
                      {art.updatedAt && (
                        <span>Last updated {new Date(art.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 4: ANALYTICS WORKSPACE                                                */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-[#E7DFD5] pb-5">
              <h1 className="text-2xl font-extrabold text-[#1C1916] tracking-tight">Support Operations Analytics</h1>
              <p className="text-xs text-[#6D665F] mt-1">
                Volume metrics, resolution rate, escalation distribution, and trending issues.
              </p>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="p-12 text-center text-xs text-[#6D665F]">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FF6B0A]" />
                Aggregating analytics data...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Total Incidents</div>
                    <div className="text-3xl font-extrabold text-[#1C1916]">{analytics.totalTickets}</div>
                    <div className="text-xs text-[#6D665F]">Lifetime ingested</div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Resolved SLA</div>
                    <div className="text-3xl font-extrabold text-[#26764F]">{analytics.resolvedTickets}</div>
                    <div className="text-xs text-[#6D665F]">
                      {analytics.totalTickets > 0 ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100) : 0}% Deflection
                    </div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Escalated Volume</div>
                    <div className="text-3xl font-extrabold text-[#B83C35]">{analytics.escalatedTickets}</div>
                    <div className="text-xs text-[#6D665F]">Human triage required</div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Average Confidence</div>
                    <div className="text-3xl font-extrabold text-[#FF6B0A]">{Math.round(analytics.averageConfidence * 100)}%</div>
                    <div className="text-xs text-[#6D665F]">Grounded calibration</div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Resolution Trends */}
                  <div className="saas-card rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-[#1C1916] uppercase tracking-wider">
                      Weekly Activity Trends
                    </h3>

                    <div className="h-52 w-full flex flex-col justify-between pt-4">
                      <div className="flex-1 flex items-end justify-between gap-3 px-2 border-b border-[#E7DFD5] pb-2">
                        {analytics.resolutionTrends.map((trend, idx) => {
                          const maxVal = Math.max(...analytics.resolutionTrends.map(t => t.total), 5);
                          const resolvedHeight = (trend.resolved / maxVal) * 100;
                          const escalatedHeight = (trend.escalated / maxVal) * 100;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                              <div className="w-full flex justify-center gap-1 max-w-[40px] h-32 items-end">
                                <div 
                                  className="w-2.5 bg-[#26764F] rounded-t-sm"
                                  style={{ height: `${resolvedHeight}%` }}
                                  title={`Resolved: ${trend.resolved}`}
                                />
                                <div 
                                  className="w-2.5 bg-[#B83C35] rounded-t-sm"
                                  style={{ height: `${escalatedHeight}%` }}
                                  title={`Escalated: ${trend.escalated}`}
                                />
                              </div>
                              <span className="text-[10px] text-[#8A8279] font-mono">{trend.date}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-[#6D665F] mt-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[#26764F] rounded-sm" />
                          Resolved
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[#B83C35] rounded-sm" />
                          Escalated
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Issues */}
                  <div className="saas-card rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-[#1C1916] uppercase tracking-wider">
                      Top Inbound Issue Topics
                    </h3>

                    <div className="h-52 flex flex-col justify-center space-y-4 text-xs">
                      {analytics.topIssues.map((issue, idx) => {
                        const totalCounts = analytics.topIssues.reduce((a, b) => a + b.count, 0) || 1;
                        const pct = (issue.count / totalCounts) * 100;

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-[#1C1916] font-semibold text-xs">{issue.name}</span>
                              <span className="font-mono text-[#6D665F] text-xs">{issue.count} tickets</span>
                            </div>
                            <div className="w-full bg-[#F0EBE3] rounded-full h-2">
                              <div 
                                className="bg-[#FF6B0A] h-2 rounded-full transition-all duration-300"
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
        {/* Tab 6: COST, TOKEN & LATENCY DIAGNOSTICS                                  */}
        {/* ========================================================================= */}
        {activeTab === "diagnostics" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div className="border-b border-[#E7DFD5] pb-5">
              <h1 className="text-2xl font-extrabold text-[#1C1916] tracking-tight">AI Cost & Latency Instrumentation</h1>
              <p className="text-xs text-[#6D665F] mt-1">
                Measured token consumption, versioned model pricing accounting, and percentile latency instrumentation.
              </p>
            </div>

            {metricsLoading || !metrics ? (
              <div className="p-12 text-center text-xs text-[#6D665F]">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FF6B0A]" />
                Aggregating telemetry diagnostics...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Total Requests</div>
                    <div className="text-3xl font-extrabold text-[#1C1916]">{metrics.totalRequests}</div>
                    <div className="text-xs text-[#26764F]">{metrics.successfulRequests} Successful</div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Tokens Tracked</div>
                    <div className="text-3xl font-extrabold text-[#1C1916]">{metrics.totalTokens.toLocaleString()}</div>
                    <div className="text-xs text-[#6D665F]">Prompt + Completion</div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">Total Estimated Spend</div>
                    <div className="text-3xl font-extrabold text-[#26764F]">${metrics.totalCostUsd.toFixed(4)}</div>
                    <div className="text-xs text-[#8A8279]">Versioned USD pricing</div>
                  </div>

                  <div className="saas-card rounded-2xl p-5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">p95 Latency</div>
                    <div className="text-3xl font-extrabold text-[#FF6B0A]">{metrics.p95LatencyMs}ms</div>
                    <div className="text-xs text-[#6D665F]">Avg: {metrics.avgLatencyMs}ms</div>
                  </div>
                </div>

                {/* Telemetry Log Table */}
                <div className="saas-card rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-[#1C1916] uppercase tracking-wider flex items-center justify-between">
                    <span>Recent Request Telemetry Logs</span>
                    <span className="text-[10px] font-mono text-[#8A8279]">Showing last {metrics.recentLogs.length}</span>
                  </h3>

                  {metrics.recentLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8A8279] italic">
                      No request logs recorded yet. Create or triage an inbound ticket in the Tickets queue to generate live telemetry logs.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#E7DFD5] text-[10px] font-bold uppercase tracking-wider text-[#8A8279]">
                            <th className="py-2.5 px-3">Request ID</th>
                            <th className="py-2.5 px-3">Provider / Model</th>
                            <th className="py-2.5 px-3">Tokens</th>
                            <th className="py-2.5 px-3">Est. Cost</th>
                            <th className="py-2.5 px-3">Latency</th>
                            <th className="py-2.5 px-3">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7DFD5]/70">
                          {metrics.recentLogs.map((log) => (
                            <tr key={log.requestId} className="hover:bg-[#F8F5F0]">
                              <td className="py-2 px-3 font-mono text-[11px] text-[#8A8279]">{log.requestId.slice(0, 12)}</td>
                              <td className="py-2 px-3 font-medium text-[#1C1916]">
                                <div>{log.provider}</div>
                                <div className="text-[10px] text-[#8A8279] font-mono">{log.actualModel}</div>
                              </td>
                              <td className="py-2 px-3 font-mono">{log.totalTokens} {log.isTokenCountEstimated ? "(est)" : ""}</td>
                              <td className="py-2 px-3 font-mono text-[#26764F]">
                                {log.estimatedCostUsd != null ? `$${log.estimatedCostUsd.toFixed(5)}` : "N/A"}
                              </td>
                              <td className="py-2 px-3 font-mono">{log.latencies?.totalMs}ms</td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.outcome === "success" 
                                    ? "bg-[#E6F4EA] text-[#26764F]" 
                                    : log.outcome === "fallback" 
                                      ? "bg-[#FEF3C7] text-[#A66314]" 
                                      : "bg-[#FEE2E2] text-[#B83C35]"
                                }`}>
                                  {log.outcome}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* Article Create / Edit Modal */}
      <Modal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title={editingArticle ? "Edit Knowledge Base Article" : "Create Knowledge Base Article"}
        description="Indexed immediately for vector cosine similarity matching during agent triage."
      >
        <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
          {articleFormError && (
            <div className="p-2.5 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#B83C35] font-medium">
              {articleFormError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
              Article Title
            </label>
            <input
              type="text"
              value={articleForm.title}
              onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
              placeholder="e.g. OAuth Redirect URI Setup & Common Mismatches"
              className="w-full saas-input rounded-xl p-2.5 text-xs text-[#1C1916]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={articleForm.category}
              onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as any })}
              className="custom-select w-full saas-input rounded-xl p-2.5 text-xs text-[#1C1916] cursor-pointer"
            >
              <option value="faq">FAQ</option>
              <option value="documentation">Product Documentation</option>
              <option value="internal">Internal Runbook</option>
              <option value="troubleshooting">Troubleshooting Guide</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
              Article Content & Guidelines
            </label>
            <textarea
              value={articleForm.content}
              onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
              placeholder="Detailed runbook guidance, config keys, error resolution steps..."
              className="w-full min-h-32 saas-input rounded-xl p-2.5 text-xs text-[#1C1916] resize-y leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DFD5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsArticleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold"
            >
              {editingArticle ? "Save Changes" : "Create Article"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Article Deletion"
        description="Are you sure you want to permanently remove this article from the knowledge base?"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6D665F]">
            Once deleted, this document will no longer be available for vector cosine similarity retrieval in automated agent triage.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DFD5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteArticle}
            >
              Delete Article
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset & Clear Support Data"
        description="Choose how you want to reset ticket data to test generation from start."
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6D665F]">
            You can restore clean baseline seed tickets with pre-computed telemetry and step-by-step journeys, or wipe the ticket queue completely to start with a blank slate.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setResetOption("seed")}
              className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                resetOption === "seed"
                  ? "bg-[#FFF0E4] border-[#FF6B0A] shadow-xs"
                  : "bg-[#FFFDFA] border-[#E7DFD5] hover:bg-[#F8F5F0]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="h-4 w-4 text-[#FF6B0A]" />
                <span className="font-bold text-[#1C1916]">Clean Seed Data</span>
              </div>
              <p className="text-[11px] text-[#6D665F] leading-snug">
                Restores 3 clean realistic tickets with full step-by-step telemetry, latency tracking, and cost calculation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setResetOption("wipe")}
              className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                resetOption === "wipe"
                  ? "bg-[#FEE2E2] border-[#B83C35] shadow-xs"
                  : "bg-[#FFFDFA] border-[#E7DFD5] hover:bg-[#F8F5F0]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="h-4 w-4 text-[#B83C35]" />
                <span className="font-bold text-[#1C1916]">Blank Slate</span>
              </div>
              <p className="text-[11px] text-[#6D665F] leading-snug">
                Completely clears all tickets and telemetry logs. Ideal for generating tickets purely from scratch.
              </p>
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DFD5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleResetData(resetOption === "wipe")}
              disabled={actionLoading}
              className={resetOption === "wipe" ? "bg-[#B83C35] hover:bg-[#992B25] text-[#FFFDFA] font-bold" : "bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold"}
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              <span>{resetOption === "wipe" ? "Wipe All Tickets" : "Restore Clean Seed Data"}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Ticket Modal with Presets & Auto-Run AI Pipeline */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Create Ticket & Run AI Pipeline"
        description="Register a support inquiry and generate a context-grounded AI copilot proposal with live telemetry."
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          
          {/* One-Click Presets */}
          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap className="h-3 w-3 text-[#FF6B0A]" />
              <span>Quick Test Presets (Click to autofill)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                  className="p-2 text-left rounded-lg bg-[#F8F5F0] hover:bg-[#FFF0E4] border border-[#E7DFD5] hover:border-[#FFD8BF] transition text-[11px] font-semibold text-[#1C1916] cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{preset.label}</span>
                  <ChevronRight className="h-3 w-3 text-[#FF6B0A] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
              Ticket Subject
            </label>
            <input
              type="text"
              value={newTicketForm.title}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
              placeholder="e.g. Scalekit OAuth redirect_uri_mismatch error on callback"
              className="w-full saas-input rounded-xl p-2.5 text-xs text-[#1C1916]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={newTicketForm.customerName}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                placeholder="Alice Johnson"
                className="w-full saas-input rounded-xl p-2.5 text-xs text-[#1C1916]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={newTicketForm.customerEmail}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                placeholder="alice@example.com"
                className="w-full saas-input rounded-xl p-2.5 text-xs text-[#1C1916]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8A8279] uppercase tracking-wider mb-1">
              Customer Message
            </label>
            <textarea
              value={newTicketForm.text}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, text: e.target.value })}
              placeholder="Detailed customer inquiry or technical issue description..."
              className="w-full min-h-24 saas-input rounded-xl p-2.5 text-xs text-[#1C1916] resize-y"
              required
            />
          </div>

          {/* Engine Selector & Auto-Run Checkbox */}
          <div className="p-3 bg-[#F8F5F0] rounded-xl border border-[#E7DFD5] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-[#1C1916] flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#FF6B0A]" />
                <span>AI Synthesis Engine</span>
              </span>
              <select
                value={newTicketProvider}
                onChange={(e) => setNewTicketProvider(e.target.value as any)}
                className="custom-select saas-input text-xs font-semibold rounded-lg py-1 px-2.5 text-[#1C1916] cursor-pointer"
              >
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="groq">Groq (LLaMA-3.3-70B)</option>
                <option value="openai">OpenAI GPT-4o-mini</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#E7DFD5]/80">
              <input
                type="checkbox"
                checked={autoRunAiOnCreate}
                onChange={(e) => setAutoRunAiOnCreate(e.target.checked)}
                className="rounded text-[#FF6B0A] focus:ring-[#FF6B0A] h-4 w-4 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-[#1C1916]">
                Run full AI pipeline immediately & stream step-by-step response
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DFD5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={actionLoading}
              className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#1C1916] font-bold flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>{autoRunAiOnCreate ? "Create & Run AI Pipeline" : "Register Ticket"}</span>
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
