import z from "zod";

export const ProviderSchema = z.enum(["openai", "gemini"]);

export type Provider = z.infer<typeof ProviderSchema>;

export const RequestSchema = z.object({
  provider: ProviderSchema,
  text: z.string().min(1),
  ticketId: z.string().optional(),
});

export const DraftSchema = z.object({
  reply: z.string().min(1),
  sources: z.array(z.string().min(1)).default([]),
  sentiment: z.enum(["positive", "neutral", "frustrated", "critical"]),
  confidenceScore: z.number().min(0).max(1),
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
