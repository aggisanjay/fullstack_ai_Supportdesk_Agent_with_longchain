/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API payloads, validated server side */
// Domain types for the support console (mirrors the FastAPI wire contract)
export interface KBArticle {
  id: string;
  title: string;
  category: "faq" | "documentation" | "internal" | "troubleshooting";
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketMessage {
  id: string;
  sender: "customer" | "agent" | "ai";
  text: string;
  createdAt: string;
}

export interface WorkflowStep {
  agent: string;
  status: "completed" | "failed" | "pending";
  output: string;
}

export interface StepDetail {
  id: string;
  name: string;
  stage: "ingestion" | "intent_classification" | "kb_retrieval" | "web_search" | "ai_synthesis" | "guardrails_evaluation" | "guardrails";
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

export interface EscalationInfo {
  recommendedResponse: string;
  suggestedActions: string[];
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface Ticket {
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

export interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  openTickets: number;
  averageConfidence: number;
  topIssues: { name: string; count: number }[];
  resolutionTrends: { date: string; resolved: number; escalated: number; total: number }[];
}

export interface TelemetryMetrics {
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

export interface ProviderStatus {
  gemini: { name: string; model: string; configured: boolean };
  groq: { name: string; model: string; configured: boolean };
  openai: { name: string; model: string; configured: boolean };
  tavily: { name: string; configured: boolean };
}

export type SupportTab = "overview" | "tickets" | "kb" | "analytics" | "diagnostics";
export type ProviderId = "gemini" | "groq" | "openai";
