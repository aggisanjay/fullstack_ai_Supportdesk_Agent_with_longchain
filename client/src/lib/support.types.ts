import { z } from "zod";

export const ResponseSchema = z.object({
  reply: z.string(),
  sources: z.array(z.string()).default([]),
});

export type SupportResponse = z.infer<typeof ResponseSchema>;

export type Provider = "openai" | "gemini";

export type ResultState = {
  reply: string;
  sources: string[];
};

export type CallAgentPayload = {
  provider: Provider;
  text: string;
};
