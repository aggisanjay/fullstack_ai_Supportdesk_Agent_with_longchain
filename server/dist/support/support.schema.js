"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketCreateSchema = exports.TicketMessageCreateSchema = exports.TicketUpdateSchema = exports.KBArticleUpdateSchema = exports.KBArticleSchema = exports.DraftSchema = exports.IntentSchema = exports.IntentCategorySchema = exports.RequestSchema = exports.ProviderSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ProviderSchema = zod_1.default.enum(["gemini", "groq", "openai"]);
exports.RequestSchema = zod_1.default.object({
    provider: exports.ProviderSchema.default("gemini"),
    text: zod_1.default.string().min(1, "Inquiry text cannot be empty").max(10000, "Text exceeds maximum character limit"),
    ticketId: zod_1.default.string().optional(),
    title: zod_1.default.string().optional(),
    customerName: zod_1.default.string().optional(),
    customerEmail: zod_1.default.string().optional(),
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
    title: zod_1.default.string().trim().min(2, "Title must be at least 2 characters").max(200, "Title cannot exceed 200 characters"),
    category: zod_1.default.enum(["faq", "documentation", "internal", "troubleshooting"]),
    content: zod_1.default.string().trim().min(5, "Content must be at least 5 characters").max(50000, "Content cannot exceed 50,000 characters"),
});
exports.KBArticleUpdateSchema = zod_1.default.object({
    title: zod_1.default.string().trim().min(2, "Title must be at least 2 characters").max(200, "Title cannot exceed 200 characters").optional(),
    category: zod_1.default.enum(["faq", "documentation", "internal", "troubleshooting"]).optional(),
    content: zod_1.default.string().trim().min(5, "Content must be at least 5 characters").max(50000, "Content cannot exceed 50,000 characters").optional(),
});
exports.TicketUpdateSchema = zod_1.default.object({
    status: zod_1.default.enum(["open", "pending", "resolved", "escalated"]),
});
exports.TicketMessageCreateSchema = zod_1.default.object({
    sender: zod_1.default.enum(["customer", "agent", "ai"]),
    text: zod_1.default.string().trim().min(1, "Message text cannot be empty").max(10000, "Message text is too long"),
    resolveTicket: zod_1.default.boolean().optional(),
});
exports.TicketCreateSchema = zod_1.default.object({
    title: zod_1.default.string().trim().min(2, "Title must be at least 2 characters").max(200),
    customerName: zod_1.default.string().trim().max(100).optional(),
    customerEmail: zod_1.default.string().trim().email("Valid customer email is required"),
    status: zod_1.default.enum(["open", "pending", "resolved", "escalated"]).default("open"),
    text: zod_1.default.string().trim().min(1, "Initial message text is required").max(10000),
});
