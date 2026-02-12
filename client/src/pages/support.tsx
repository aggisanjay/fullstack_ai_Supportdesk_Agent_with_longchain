import SupportAgentUi from "@/components/support/support-agent-ui";
import { apiPost } from "@/lib/api";
import {
  ResponseSchema,
  type CallAgentPayload,
  type Provider,
  type ResultState,
  type SupportResponse,
} from "@/lib/support.types";
import { useState } from "react";

export default function Support() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [ticket, setTicket] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<ResultState | null>(null);

  function resetUiForNewTask() {
    setResult(null);
  }

  async function callAgent(payload: CallAgentPayload) {
    setLoading(true);

    const res = await apiPost("/api/support/run", payload);

    setLoading(false);

    if (!res.ok) {
      return null;
    }

    const parsed = ResponseSchema.safeParse(res.data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data as SupportResponse;
  }

  async function startAgentRun() {
    resetUiForNewTask();

    const getTicket = ticket.trim();

    if (!getTicket) return;

    const data = await callAgent({ provider, text: getTicket });

    if (!data) return;

    setResult({
      reply: data.reply,
      sources: data.sources,
    });
  }

  return (
    <SupportAgentUi
      provider={provider}
      onProviderChange={setProvider}
      ticket={ticket}
      onTicketChange={setTicket}
      loading={loading}
      result={result}
      onAgentRun={startAgentRun}
    />
  );
}
