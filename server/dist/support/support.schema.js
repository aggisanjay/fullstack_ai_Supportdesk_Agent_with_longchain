"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketUpdateSchema = exports.KBArticleSchema = exports.DraftSchema = exports.IntentSchema = exports.IntentCategorySchema = exports.RequestSchema = exports.ProviderSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ProviderSchema = zod_1.default.enum(["gemini", "groq", "openai"]);
exports.RequestSchema = zod_1.default.object({
    provider: exports.ProviderSchema.default("gemini"),
    text: zod_1.default.string().min(1),
    ticketId: zod_1.default.string().optional(),
});
exports.IntentCategorySchema = zod_1.default.enum([
    "billing",
    "technical/integration",
    "account/access",
    "bug report",
    "feature request",
    "general",
]);
exports.IntentSchema = zod_1.default.object({
    intentCategory: exports.IntentCategorySchema.default("general"),
    intentSummary: zod_1.default.string().default("Customer inquiry regarding platform capabilities."),
    requiresWebSearch: zod_1.default.boolean().default(false),
    searchReasoning: zod_1.default.string().default("Query is evaluated against internal knowledge base."),
});
exports.DraftSchema = zod_1.default.object({
    reply: zod_1.default.string().min(1),
    sources: zod_1.default.array(zod_1.default.string().min(1)).default([]),
    sentiment: zod_1.default.enum(["positive", "neutral", "frustrated", "critical"]),
    confidenceScore: zod_1.default.number().min(0).max(1),
    intentCategory: zod_1.default.string().optional(),
    intentSummary: zod_1.default.string().optional(),
    confidenceBreakdown: zod_1.default.string().optional(),
});
exports.KBArticleSchema = zod_1.default.object({
    title: zod_1.default.string().min(2),
    category: zod_1.default.enum(["faq", "documentation", "internal", "troubleshooting"]),
    content: zod_1.default.string().min(5),
});
exports.TicketUpdateSchema = zod_1.default.object({
    status: zod_1.default.enum(["open", "pending", "resolved", "escalated"]),
});
