export interface ModelPricing {
  provider: "gemini" | "groq" | "openai";
  modelId: string;
  inputTokenPricePerMillion: number;
  outputTokenPricePerMillion: number;
  cachedInputPricePerMillion?: number;
  currency: string;
  effectiveDate: string;
  pricingSourceUrl: string;
  lastVerifiedDate: string;
}

export const PROVIDER_PRICING: Record<string, ModelPricing> = {
  "gemini-2.5-flash": {
    provider: "gemini",
    modelId: "gemini-2.5-flash",
    inputTokenPricePerMillion: 0.075,
    outputTokenPricePerMillion: 0.30,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://ai.google.dev/pricing",
    lastVerifiedDate: "2026-01-15",
  },
  "gemini-flash-latest": {
    provider: "gemini",
    modelId: "gemini-flash-latest",
    inputTokenPricePerMillion: 0.075,
    outputTokenPricePerMillion: 0.30,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://ai.google.dev/pricing",
    lastVerifiedDate: "2026-01-15",
  },
  "gemini-1.5-flash": {
    provider: "gemini",
    modelId: "gemini-1.5-flash",
    inputTokenPricePerMillion: 0.075,
    outputTokenPricePerMillion: 0.30,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://ai.google.dev/pricing",
    lastVerifiedDate: "2026-01-15",
  },
  "qwen/qwen3.8-27b": {
    provider: "groq",
    modelId: "qwen/qwen3.8-27b",
    inputTokenPricePerMillion: 0.20,
    outputTokenPricePerMillion: 0.40,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://groq.com/pricing",
    lastVerifiedDate: "2026-01-15",
  },
  "llama-3.3-70b-versatile": {
    provider: "groq",
    modelId: "llama-3.3-70b-versatile",
    inputTokenPricePerMillion: 0.59,
    outputTokenPricePerMillion: 0.79,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://groq.com/pricing",
    lastVerifiedDate: "2026-01-15",
  },
  "gpt-4o-mini": {
    provider: "openai",
    modelId: "gpt-4o-mini",
    inputTokenPricePerMillion: 0.15,
    outputTokenPricePerMillion: 0.60,
    currency: "USD",
    effectiveDate: "2025-01-01",
    pricingSourceUrl: "https://openai.com/api/pricing/",
    lastVerifiedDate: "2026-01-15",
  },
};

export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  // Conservative industry estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

export function calculateEstimatedCost(args: {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
}): { estimatedCostUsd: number | null; pricingModel: ModelPricing | null } {
  let pricing = PROVIDER_PRICING[args.modelId];
  if (!pricing) {
    // Graceful match by provider or prefix
    if (args.modelId.includes("gemini")) {
      pricing = PROVIDER_PRICING["gemini-2.5-flash"];
    } else if (args.modelId.includes("qwen") || args.modelId.includes("llama")) {
      pricing = PROVIDER_PRICING["qwen/qwen3.8-27b"];
    } else {
      pricing = PROVIDER_PRICING["gpt-4o-mini"];
    }
  }

  const inputCost = (args.promptTokens / 1_000_000) * pricing.inputTokenPricePerMillion;
  const outputCost = (args.completionTokens / 1_000_000) * pricing.outputTokenPricePerMillion;
  const totalCost = Number((inputCost + outputCost).toFixed(6));

  return { estimatedCostUsd: totalCost, pricingModel: pricing };
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, Math.min(index, sorted.length - 1))].toFixed(2));
}
