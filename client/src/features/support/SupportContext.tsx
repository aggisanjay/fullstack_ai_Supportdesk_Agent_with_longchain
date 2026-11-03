import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { SAMPLE_PRESETS } from "./constants";
import type { AnalyticsData, KBArticle, ProviderId, ProviderStatus, SupportTab, TelemetryMetrics, Ticket } from "./types";
import { useRunPipeline } from "./useRunPipeline";

import { SupportCtx } from "./supportCtx";

// eslint-disable-next-line react-refresh/only-export-components -- type source for supportCtx
export function useSupportState() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ticketMatch = useMatch("/support/tickets/:ticketId");

  // ---- routing-derived state --------------------------------------------------
  const seg = location.pathname.split("/")[2] as SupportTab | undefined;
  const activeTab: SupportTab = seg && ["overview", "tickets", "kb", "analytics", "diagnostics"].includes(seg) ? seg : "tickets";
  const selectedTicketId = ticketMatch?.params.ticketId ?? null;
  const setActiveTab = useCallback((t: SupportTab) => navigate(`/support/${t}`), [navigate]);
  const setSelectedTicketId = useCallback((id: string | null) => navigate(id ? `/support/tickets/${id}` : "/support/tickets"), [navigate]);

  // ---- data -------------------------------------------------------------------
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [providers, setProviders] = useState<ProviderStatus | null>(null);

  const [ticketFilter, setTicketFilter] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [kbFilter, setKbFilter] = useState("all");
  const [kbSearch, setKbSearch] = useState("");

  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // modals + forms
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetOption, setResetOption] = useState<"seed" | "wipe">("seed");
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketProvider, setNewTicketProvider] = useState<ProviderId>("gemini");
  const [autoRunAiOnCreate, setAutoRunAiOnCreate] = useState(true);
  const [newTicketForm, setNewTicketForm] = useState({ title: "", customerName: "", customerEmail: "", text: "" });
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [articleForm, setArticleForm] = useState({ title: "", category: "faq" as KBArticle["category"], content: "" });
  const [articleFormError, setArticleFormError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // live agent run (real LangGraph events over SSE)
  const pipeline = useRunPipeline();
  const isLiveGenerating = pipeline.state.status === "running";
  const liveElapsedMs = pipeline.state.elapsedMs;

  const loadTickets = async () => {
    setTicketsLoading(true);
    const res = await apiGet<Ticket[]>("/api/support/tickets");
    if (res.ok && Array.isArray(res.data)) setTickets(res.data);
    setTicketsLoading(false);
  };
  const loadKb = async () => {
    setKbLoading(true);
    const res = await apiGet<KBArticle[]>("/api/support/kb");
    if (res.ok && Array.isArray(res.data)) setKbArticles(res.data);
    setKbLoading(false);
  };
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const res = await apiGet<AnalyticsData>("/api/support/analytics");
    if (res.ok && res.data) setAnalytics(res.data);
    setAnalyticsLoading(false);
  };
  const loadMetrics = async () => {
    setMetricsLoading(true);
    const res = await apiGet<TelemetryMetrics>("/api/support/metrics");
    if (res.ok && res.data) setMetrics(res.data);
    setMetricsLoading(false);
  };
  const loadProviders = async () => {
    const res = await apiGet<ProviderStatus>("/api/support/providers");
    if (res.ok && res.data) setProviders(res.data);
  };
  const refreshAll = async () => {
    await Promise.all([loadTickets(), loadAnalytics(), loadMetrics()]);
  };

  useEffect(() => {
    loadTickets();
    loadKb();
    loadAnalytics();
    loadMetrics();
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || (selectedTicketId ? null : tickets[0] ?? null);

  const handleCopyResponse = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleResetData = async (wipeAll: boolean) => {
    setActionLoading(true);
    const res = await apiPost<{ message: string; tickets: Ticket[] }>(wipeAll ? "/api/support/tickets/clear" : "/api/support/reset", {});
    if (res.ok) {
      setIsResetModalOpen(false);
      await Promise.all([loadTickets(), loadKb(), loadAnalytics(), loadMetrics()]);
      setSelectedTicketId(res.data?.tickets?.[0]?.id ?? null);
    }
    setActionLoading(false);
  };

  /** Re-run the agents on an existing ticket, streaming the real pipeline. */
  const handleRegenerateDraft = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    const customerMsgs = activeTicket.messages.filter((m) => m.sender === "customer");
    const text = customerMsgs.length ? customerMsgs[customerMsgs.length - 1].text : activeTicket.title;
    const provider = ((activeTicket.telemetry?.provider as ProviderId) || newTicketProvider) as ProviderId;
    const result = await pipeline.run({ provider, text, ticketId: activeTicket.id });
    if (result) await refreshAll();
    setActionLoading(false);
  };

  /** Create a ticket and run it through the agent graph, streaming progress. */
  const handleCreateTicket = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const f = newTicketForm;
    if (!f.text.trim()) return;
    setIsNewTicketModalOpen(false);
    setActionLoading(true);
    const result = await pipeline.run({
      provider: newTicketProvider,
      text: f.text.trim(),
      title: f.title.trim() || undefined,
      customerName: f.customerName.trim() || undefined,
      customerEmail: f.customerEmail.trim() || undefined,
    });
    if (result) {
      setNewTicketForm({ title: "", customerName: "", customerEmail: "", text: "" });
      await refreshAll();
    }
    setActionLoading(false);
  };

  const openTicketFromRun = (id: string) => {
    pipeline.reset();
    navigate(`/support/tickets/${id}`);
  };
  const retryRun = () => {
    const req = pipeline.state.request;
    if (req) pipeline.run(req).then((r) => r && refreshAll());
  };

  const openArticleModal = (article?: KBArticle) => {
    setArticleFormError("");
    if (article) {
      setEditingArticle(article);
      setArticleForm({ title: article.title, category: article.category, content: article.content });
    } else {
      setEditingArticle(null);
      setArticleForm({ title: "", category: "faq", content: "" });
    }
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      setArticleFormError("Please fill in both title and article content.");
      return;
    }
    const res = editingArticle
      ? await apiPatch<KBArticle>(`/api/support/kb/${editingArticle.id}`, articleForm)
      : await apiPost<KBArticle>("/api/support/kb", articleForm);
    if (res.ok) {
      setIsArticleModalOpen(false);
      await loadKb();
    } else setArticleFormError(editingArticle ? "Failed to update article." : "Failed to create article.");
  };

  const handleDeleteArticle = async () => {
    if (!deleteConfirmId) return;
    const res = await apiDelete(`/api/support/kb/${deleteConfirmId}`);
    if (res.ok) {
      setDeleteConfirmId(null);
      await loadKb();
    }
  };

  const filteredTickets = useMemo(
    () =>
      tickets.filter((t) => {
        const q = ticketSearch.toLowerCase();
        return (ticketFilter === "all" || t.status === ticketFilter) && (!q || t.title.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
      }),
    [tickets, ticketFilter, ticketSearch],
  );
  const filteredKbArticles = useMemo(
    () =>
      kbArticles.filter((a) => {
        const q = kbSearch.toLowerCase();
        return (kbFilter === "all" || a.category === kbFilter) && (!q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }),
    [kbArticles, kbFilter, kbSearch],
  );

  return {
    user, activeTab, setActiveTab, selectedTicketId, setSelectedTicketId,
    tickets, kbArticles, analytics, metrics, providers,
    ticketFilter, setTicketFilter, ticketSearch, setTicketSearch, kbFilter, setKbFilter, kbSearch, setKbSearch,
    ticketsLoading, kbLoading, analyticsLoading, metricsLoading, actionLoading,
    isResetModalOpen, setIsResetModalOpen, resetOption, setResetOption,
    isNewTicketModalOpen, setIsNewTicketModalOpen, newTicketProvider, setNewTicketProvider,
    autoRunAiOnCreate, setAutoRunAiOnCreate, newTicketForm, setNewTicketForm,
    isArticleModalOpen, setIsArticleModalOpen, editingArticle, articleForm, setArticleForm, articleFormError,
    deleteConfirmId, setDeleteConfirmId, copiedResponse,
    pipeline, isLiveGenerating, liveElapsedMs, openTicketFromRun, retryRun,
    activeTicket, filteredTickets, filteredKbArticles,
    handleCopyResponse, handleResetData, handleRegenerateDraft, handleCreateTicket,
    openArticleModal, handleSaveArticle, handleDeleteArticle,
    loadTickets, loadKb, loadAnalytics, loadMetrics, loadProviders, refreshAll,
    SAMPLE_PRESETS,
  };
}

export function SupportProvider({ children }: { children: ReactNode }) {
  const value = useSupportState();
  return <SupportCtx.Provider value={value}>{children}</SupportCtx.Provider>;
}
