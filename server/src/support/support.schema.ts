import z from "zod";

export const ProviderSchema = z.enum(["gemini", "groq", "openai"]);

export type Provider = z.infer<typeof ProviderSchema>;

export const RequestSchema = z.object({
  provider: ProviderSchema.default("gemini"),
  text: z.string().min(1),
  ticketId: z.string().optional(),
});

export const IntentCategorySchema = z.enum([
  "billing",
  "technical/integration",
  "account/access",
  "bug report",
  "feature request",
  "general",
]);

export type IntentCategory = z.infer<typeof IntentCategorySchema>;

export const IntentSchema = z.object({
  intentCategory: IntentCategorySchema.default("general"),
  intentSummary: z.string().default("Customer inquiry regarding platform capabilities."),
  requiresWebSearch: z.boolean().default(false),
  searchReasoning: z.string().default("Query is evaluated against internal knowledge base."),
});

export type IntentClassification = z.infer<typeof IntentSchema>;

export const DraftSchema = z.object({
  reply: z.string().min(1),
  sources: z.array(z.string().min(1)).default([]),
  sentiment: z.enum(["positive", "neutral", "frustrated", "critical"]),
  confidenceScore: z.number().min(0).max(1),
  intentCategory: z.string().optional(),
  intentSummary: z.string().optional(),
  confidenceBreakdown: z.string().optional(),
});

export type SupportResponse = z.infer<typeof DraftSchema>;

export const KBArticleSchema = z.object({
  title: z.string().min(2),
  category: z.enum(["faq", "documentation", "internal", "troubleshooting"]),
  content: z.string().min(5),
});

export const TicketUpdateSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "escalated"]),
});
