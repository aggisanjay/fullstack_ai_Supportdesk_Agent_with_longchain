"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketUpdateSchema = exports.KBArticleSchema = exports.DraftSchema = exports.RequestSchema = exports.ProviderSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ProviderSchema = zod_1.default.enum(["openai", "gemini"]);
exports.RequestSchema = zod_1.default.object({
    provider: exports.ProviderSchema,
    text: zod_1.default.string().min(1),
    ticketId: zod_1.default.string().optional(),
});
exports.DraftSchema = zod_1.default.object({
    reply: zod_1.default.string().min(1),
    sources: zod_1.default.array(zod_1.default.string().min(1)).default([]),
    sentiment: zod_1.default.enum(["positive", "neutral", "frustrated", "critical"]),
    confidenceScore: zod_1.default.number().min(0).max(1),
});
exports.KBArticleSchema = zod_1.default.object({
    title: zod_1.default.string().min(2),
    category: zod_1.default.enum(["faq", "documentation", "internal", "troubleshooting"]),
    content: zod_1.default.string().min(5),
});
exports.TicketUpdateSchema = zod_1.default.object({
    status: zod_1.default.enum(["open", "pending", "resolved", "escalated"]),
});
