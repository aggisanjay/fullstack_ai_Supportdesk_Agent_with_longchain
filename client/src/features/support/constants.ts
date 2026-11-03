export const SAMPLE_PRESETS = [
  {
    label: "OAuth Redirect Mismatch",
    title: "OAuth redirect_uri_mismatch error on callback",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    text: "Hi support team, I am trying to authenticate via Scalekit OAuth but I keep getting a redirect_uri_mismatch error on the callback. Can you please check what might be wrong? We need this fixed today.",
  },
  {
    label: "HMAC Webhook Failure",
    title: "Express HMAC SHA-256 Webhook signature mismatch",
    customerName: "Bob Smith",
    customerEmail: "bob@devops.io",
    text: "I am trying to deploy webhooks but signature verification keeps failing. I have copied the signing secret exactly but the crypt hash comparison always returns false. This is blocking our launch.",
  },
  {
    label: "Billing Double Charge",
    title: "Double invoice deduction during billing upgrade",
    customerName: "Elena Rostova",
    customerEmail: "elena@fintech.co",
    text: "Our card was charged twice for the annual Enterprise license on invoice #INV-9281. Can you please review our transaction and issue a credit or refund for the extra charge?",
  },
  {
    label: "Access Token 401",
    title: "Expired developer access token 401 unauthorized",
    customerName: "Marcus Vance",
    customerEmail: "marcus@cloudscale.net",
    text: "All our API requests started returning 401 Unauthorized after we rotated our client credentials. Where do we generate a fresh secret in the admin portal?",
  },
];


export type StageId = "ingestion" | "intent_classification" | "kb_retrieval" | "web_search" | "ai_synthesis" | "guardrails";

/** The six stages of the wire contract, and which LangGraph node reports each one. */
export const PIPELINE_STAGES: Array<{ id: StageId; node: string; agent: string; label: string; desc: string }> = [
  { id: "ingestion", node: "ingest_and_classify", agent: "Ingestion Agent", label: "Ticket ingestion", desc: "Read the message and evaluate customer sentiment" },
  { id: "intent_classification", node: "ingest_and_classify", agent: "Intent Agent", label: "Intent & routing", desc: "Classify the ticket and decide whether the web is needed" },
  { id: "kb_retrieval", node: "retrieve_knowledge", agent: "Knowledge Agent", label: "Knowledge retrieval", desc: "Cosine search over embedded runbook chunks in pgvector" },
  { id: "web_search", node: "ground_web_search", agent: "Search Agent", label: "Web grounding", desc: "Live Tavily search for docs and specifications" },
  { id: "ai_synthesis", node: "synthesize_draft", agent: "Response Agent", label: "Response synthesis", desc: "Draft the Tier-2 reply with the selected model" },
  { id: "guardrails", node: "guardrails_and_accounting", agent: "Guardrails", label: "Guardrails & cost", desc: "Blend confidence, count tokens, price the run, decide escalation" },
];

export const ESCALATION_FLOOR = 0.7;
