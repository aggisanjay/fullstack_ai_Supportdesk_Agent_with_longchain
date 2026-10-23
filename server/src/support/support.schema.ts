import z from "zod";

export const ProviderSchema = z.enum(["gemini", "groq", "openai"]);

export type Provider = z.infer<typeof ProviderSchema>;

export const RequestSchema = z.object({
  provider: ProviderSchema.default("gemini"),
  text: z.string().min(1, "Inquiry text cannot be empty").max(10000, "Text exceeds maximum character limit"),
  ticketId: z.string().optional(),
  title: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
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
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200, "Title cannot exceed 200 characters"),
  category: z.enum(["faq", "documentation", "internal", "troubleshooting"]),
  content: z.string().trim().min(5, "Content must be at least 5 characters").max(50000, "Content cannot exceed 50,000 characters"),
});

export const KBArticleUpdateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200, "Title cannot exceed 200 characters").optional(),
  category: z.enum(["faq", "documentation", "internal", "troubleshooting"]).optional(),
  content: z.string().trim().min(5, "Content must be at least 5 characters").max(50000, "Content cannot exceed 50,000 characters").optional(),
});

export const TicketUpdateSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "escalated"]),
});

export const TicketMessageCreateSchema = z.object({
  sender: z.enum(["customer", "agent", "ai"]),
  text: z.string().trim().min(1, "Message text cannot be empty").max(10000, "Message text is too long"),
  resolveTicket: z.boolean().optional(),
});

export const TicketCreateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  customerName: z.string().trim().max(100).optional(),
  customerEmail: z.string().trim().email("Valid customer email is required"),
  status: z.enum(["open", "pending", "resolved", "escalated"]).default("open"),
  text: z.string().trim().min(1, "Initial message text is required").max(10000),
});
