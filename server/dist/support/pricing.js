"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_PRICING = void 0;
exports.estimateTokensFromText = estimateTokensFromText;
exports.calculateEstimatedCost = calculateEstimatedCost;
exports.calculatePercentile = calculatePercentile;
exports.PROVIDER_PRICING = {
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
function estimateTokensFromText(text) {
    if (!text)
        return 0;
    // Conservative industry estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
}
function calculateEstimatedCost(args) {
    let pricing = exports.PROVIDER_PRICING[args.modelId];
    if (!pricing) {
        // Graceful match by provider or prefix
        if (args.modelId.includes("gemini")) {
            pricing = exports.PROVIDER_PRICING["gemini-2.5-flash"];
        }
        else if (args.modelId.includes("qwen") || args.modelId.includes("llama")) {
            pricing = exports.PROVIDER_PRICING["qwen/qwen3.8-27b"];
        }
        else {
            pricing = exports.PROVIDER_PRICING["gpt-4o-mini"];
        }
    }
    const inputCost = (args.promptTokens / 1000000) * pricing.inputTokenPricePerMillion;
    const outputCost = (args.completionTokens / 1000000) * pricing.outputTokenPricePerMillion;
    const totalCost = Number((inputCost + outputCost).toFixed(6));
    return { estimatedCostUsd: totalCost, pricingModel: pricing };
}
function calculatePercentile(values, percentile) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Number(sorted[Math.max(0, Math.min(index, sorted.length - 1))].toFixed(2));
}
