import z from "zod";

export const ProviderSchema = z.enum(["openai", "gemini"]);

export type Provider = z.infer<typeof ProviderSchema>;

export const RequestSchema = z.object({
  provider: ProviderSchema,
  text: z.string().min(1),
});

export const DraftSchema = z.object({
  reply: z.string().min(1),
  sources: z.array(z.string().min(1)).max(3),
});

export type SupportResponse = z.infer<typeof DraftSchema>;
