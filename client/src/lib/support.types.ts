import { z } from "zod";

export const ResponseSchema = z.object({
  reply: z.string(),
  sources: z.array(z.string()).default([]),
});

export type SupportResponse = z.infer<typeof ResponseSchema>;

export type Provider = "gemini" | "groq" | "openai";

export type ResultState = {
  reply: string;
  sources: string[];
  intentCategory?: string;
  intentSummary?: string;
  confidenceBreakdown?: string;
};

export type CallAgentPayload = {
  provider: Provider;
  text: string;
};
