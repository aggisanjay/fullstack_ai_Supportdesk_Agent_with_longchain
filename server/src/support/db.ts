import fs from "fs";
import path from "path";
import { calculatePercentile } from "./pricing";

export interface KBArticle {
  id: string;
  title: string;
  category: "faq" | "documentation" | "internal" | "troubleshooting";
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketMessage {
  id: string;
  sender: "customer" | "agent" | "ai";
  text: string;
  createdAt: string;
}

export interface WorkflowStep {
  agent: string;
  status: "completed" | "failed" | "pending";
  output: string;
}

export interface StepDetail {
  id: string;
  name: string;
  stage: "ingestion" | "intent_classification" | "kb_retrieval" | "web_search" | "ai_synthesis" | "guardrails_evaluation";
  status: "completed" | "in_progress" | "failed" | "skipped";
  agent: string;
  durationMs: number;
  timestamp: string;
  summary: string;
  details?: Record<string, any>;
}

export interface TicketTelemetry {
  requestId: string;
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  isTokenCountEstimated: boolean;
  costUsd: number | null;
  formattedCost: string;
  latencies: {
    totalMs: number;
    intentMs: number;
    kbMs: number;
    searchMs: number;
    modelMs: number;
  };
}

export interface EscalationInfo {
  recommendedResponse: string;
  suggestedActions: string[];
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface Ticket {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  status: "open" | "pending" | "resolved" | "escalated";
  sentiment: "positive" | "neutral" | "frustrated" | "critical";
  intentCategory?: string;
  intentSummary?: string;
  confidenceScore: number;
  confidenceBreakdown?: string;
  sourceCount: number;
  sources?: string[];
  searchResults?: SearchResultItem[];
  searchQuery?: string;
  retrievalStatus: "success" | "none" | "failed";
  messages: TicketMessage[];
  workflowSteps: WorkflowStep[];
  detailedSteps?: StepDetail[];
  telemetry?: TicketTelemetry;
  escalation?: EscalationInfo;
  createdAt: string;
  updatedAt?: string;
}

export interface TelemetryRecord {
  requestId: string;
  timestamp: string;
  provider: "gemini" | "groq" | "openai";
  actualModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  isTokenCountEstimated: boolean;
  estimatedCostUsd: number | null;
  outcome: "success" | "failed" | "fallback";
  failureReason?: string;
  latencies: {
    totalMs: number;
    intentMs: number;
    kbMs: number;
    searchMs: number;
    modelMs: number;
  };
  ticketId?: string;
}

interface DBState {
  articles: KBArticle[];
  tickets: Ticket[];
  telemetry: TelemetryRecord[];
}

const DB_FILE = path.join(process.cwd(), "db.json");
const DB_TMP_FILE = path.join(process.cwd(), "db.tmp.json");

const DEFAULT_ARTICLES: KBArticle[] = [
  {
    id: "kb_1",
    title: "How to retrieve a Scalekit client secret",
    category: "faq",
    content: "To retrieve your client secret in Scalekit, log in to the Scalekit Admin Dashboard, select your environment (e.g., Development or Production), navigate to 'API Settings' or 'Client Credentials', and click 'Generate Secret'. Make sure to copy it immediately, as it will only be displayed once.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_2",
    title: "OAuth Redirect URI Setup Guide",
    category: "documentation",
    content: "When setting up Single Sign-On (SSO) or OAuth, you must configure a Redirect URI. The redirect URI is where the authorization server sends the user after successful authentication. For local testing, use: http://localhost:5000/auth/callback. In production, ensure this is set to your HTTPS backend endpoint and matches exactly.",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_3",
    title: "LangGraph Agent Troubleshooting Guidelines",
    category: "internal",
    content: "If the LangGraph support agent fails with status 422 (sources are empty or not allowed), check if a web search was performed via Tavily. The agent's response format schema requires that any source URL returned must be a subset of the Tavily search results. If the user explicitly asks for docs or oauth features, the web search will trigger, so ensure TAVILY_API_KEY is active.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_4",
    title: "Resolving Webhook Signature Failures",
    category: "troubleshooting",
    content: "Webhook verification errors usually happen when the payload is modified or parsed before hashing. Verify that: 1. You are using the raw request body buffer to compute the HMAC-SHA256 signature. 2. The signing secret matches the secret from your developer portal. 3. The signature algorithm is SHA-256.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: "t_1",
    title: "OAuth Redirect URI mismatch error in Scalekit",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    status: "open",
    sentiment: "frustrated",
    intentCategory: "technical/integration",
    intentSummary: "Customer is experiencing redirect_uri_mismatch during Scalekit OAuth callback configuration.",
    confidenceScore: 0.88,
    confidenceBreakdown: "1 KB article matched (OAuth Redirect URI Setup Guide, 92% match), 0 web citations, 85% model self-assessment",
    sourceCount: 1,
    sources: [
      "https://docs.scalekit.com/sso/redirect-uri",
      "https://auth0.com/docs/troubleshoot/authentication/redirect-uri-mismatch"
    ],
    searchQuery: "Scalekit OAuth redirect_uri_mismatch troubleshooting",
    searchResults: [
      {
        title: "Single Sign-On (SSO) & OAuth Redirect URI Setup",
        url: "https://docs.scalekit.com/sso/redirect-uri",
        snippet: "Ensure redirect_uri in your client authorization request matches exactly byte-for-byte with the allowed callback URLs registered in your Scalekit developer portal."
      },
      {
        title: "Resolving Redirect URI Mismatch Errors in Node.js",
        url: "https://auth0.com/docs/troubleshoot/authentication/redirect-uri-mismatch",
        snippet: "Common cause: Protocol (http vs https), port number mismatch, or trailing slash difference in registered redirect URI."
      }
    ],
    retrievalStatus: "success",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg_1_1",
        sender: "customer",
        text: "Hi support team, I am trying to authenticate via Scalekit OAuth but I keep getting a redirect_uri_mismatch error on the callback. Can you please check what might be wrong? We need this fixed today.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg_1_2",
        sender: "ai",
        text: "Hello Alice, I see you are experiencing a redirect_uri_mismatch error. This error indicates that the callback URL sent in the request does not match the redirect URL registered in your Scalekit developer console.\n\nPlease verify that 'http://localhost:5000/auth/callback' is registered as an authorized redirect URI in your settings.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10000).toISOString(),
      }
    ],
    workflowSteps: [
      { agent: "Intent Agent", status: "completed", output: "[technical/integration] User needs resolution for OAuth redirect URI mismatch during SSO authentication." },
      { agent: "Knowledge Agent", status: "completed", output: "Retrieved article 'OAuth Redirect URI Setup Guide' (92% semantic cosine match)." },
      { agent: "Search Agent", status: "completed", output: "Skipped external web search because internal knowledge article provides exact resolution." },
      { agent: "Response Agent", status: "completed", output: "Drafted response with 88% blended confidence (1 KB source + 85% model score)." }
    ],
    telemetry: {
      requestId: "req_init_t1",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      provider: "gemini",
      model: "gemini-1.5-flash",
      promptTokens: 840,
      completionTokens: 210,
      totalTokens: 1050,
      isTokenCountEstimated: false,
      costUsd: 0.000126,
      formattedCost: "$0.000126 USD",
      latencies: {
        totalMs: 382.4,
        intentMs: 24.1,
        kbMs: 8.6,
        searchMs: 0.0,
        modelMs: 349.7,
      }
    },
    detailedSteps: [
      {
        id: "step_1_1",
        name: "Ticket Ingestion & Sentiment Analysis",
        stage: "ingestion",
        status: "completed",
        agent: "Ingestion Agent",
        durationMs: 2.1,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "Ingested customer query (192 chars). Customer sentiment: 'frustrated' due to launch block.",
      },
      {
        id: "step_1_2",
        name: "Intent Classification & Routing",
        stage: "intent_classification",
        status: "completed",
        agent: "Intent Agent",
        durationMs: 24.1,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20).toISOString(),
        summary: "Classified category as 'technical/integration'. Summary: Customer blocked by redirect_uri_mismatch during Scalekit OAuth callback.",
      },
      {
        id: "step_1_3",
        name: "Semantic Knowledge Base Matching",
        stage: "kb_retrieval",
        status: "completed",
        agent: "Knowledge Agent",
        durationMs: 8.6,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 50).toISOString(),
        summary: "Executed cosine TF-IDF vector matching. Matched 'OAuth Redirect URI Setup Guide' (92% relevance).",
      },
      {
        id: "step_1_4",
        name: "Web Search Grounding Decision",
        stage: "web_search",
        status: "skipped",
        agent: "Search Agent",
        durationMs: 0.5,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60).toISOString(),
        summary: "Skipped external web search. Internal knowledge runbook provides 100% grounded technical answer.",
      },
      {
        id: "step_1_5",
        name: "Multi-Model AI Synthesis",
        stage: "ai_synthesis",
        status: "completed",
        agent: "Response Agent (Gemini)",
        durationMs: 349.7,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 70).toISOString(),
        summary: "Synthesized verified technical solution via Gemini 1.5 Flash. Consumed 840 prompt tokens and 210 output tokens.",
      },
      {
        id: "step_1_6",
        name: "Guardrails & Operational Cost Accounting",
        stage: "guardrails_evaluation",
        status: "completed",
        agent: "Guardrails & Accounting",
        durationMs: 1.2,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 420).toISOString(),
        summary: "Blended confidence: 88%. Total cost: $0.000126 USD. Bypassed auto-escalation as verified runbook matched.",
      }
    ]
  },
  {
    id: "t_2",
    title: "Webhook signature mismatch on node express server",
    customerName: "Bob Smith",
    customerEmail: "bob@devops.io",
    status: "escalated",
    sentiment: "critical",
    intentCategory: "bug report",
    intentSummary: "Customer is blocked by HMAC SHA-256 webhook signature verification failure on Node Express.",
    confidenceScore: 0.45,
    sourceCount: 2,
    sources: [
      "https://expressjs.com/en/resources/middleware/body-parser.html",
      "https://nodejs.org/api/crypto.html#cryptotimingsafeequal"
    ],
    searchQuery: "Node express rawBody HMAC signature verification",
    searchResults: [
      {
        title: "Capturing Raw Request Body for HMAC in Express.js",
        url: "https://expressjs.com/en/resources/middleware/body-parser.html",
        snippet: "Use the verify callback in express.json({ verify: (req, res, buf) => req.rawBody = buf }) to capture the unparsed buffer for crypto.createHmac verification."
      },
      {
        title: "Verifying Webhook Signatures with Node.js crypto.timingSafeEqual",
        url: "https://nodejs.org/api/crypto.html#cryptotimingsafeequal",
        snippet: "Always use timingSafeEqual when comparing generated HMAC hashes to protect against timing side-channel attacks."
      }
    ],
    retrievalStatus: "success",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg_2_1",
        sender: "customer",
        text: "I am trying to deploy webhooks but signature verification keeps failing. I have copied the signing secret exactly but the crypt hash comparison always returns false. This is blocking our launch.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg_2_2",
        sender: "ai",
        text: "Hello Bob, I apologize for the inconvenience. A webhook signature failure usually occurs because your Express backend parses the body into JSON before verification, changing the raw string representation. Please verify that you are extracting the raw body buffer when checking the HMAC signature.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15000).toISOString(),
      }
    ],
    workflowSteps: [
      { agent: "Intent Agent", status: "completed", output: "[bug report] Critical HMAC SHA-256 verification failure blocking production webhook launch." },
      { agent: "Knowledge Agent", status: "completed", output: "Searched internal knowledge base but match score was below confidence threshold (18%)." },
      { agent: "Search Agent", status: "completed", output: "Executed live Tavily search for 'Node express rawBody HMAC signature verification' (retrieved 2 URLs)." },
      { agent: "Response Agent", status: "completed", output: "Formulated response. Triggered automated Tier-2 escalation due to critical customer sentiment and low grounding confidence (45%)." }
    ],
    telemetry: {
      requestId: "req_init_t2",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      promptTokens: 960,
      completionTokens: 280,
      totalTokens: 1240,
      isTokenCountEstimated: false,
      costUsd: 0.000788,
      formattedCost: "$0.000788 USD",
      latencies: {
        totalMs: 442.1,
        intentMs: 22.4,
        kbMs: 9.1,
        searchMs: 148.2,
        modelMs: 262.4,
      }
    },
    detailedSteps: [
      {
        id: "step_2_1",
        name: "Ticket Ingestion & Sentiment Analysis",
        stage: "ingestion",
        status: "completed",
        agent: "Ingestion Agent",
        durationMs: 1.8,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "Ingested critical customer ticket. Detected high-severity 'critical' sentiment with blocking impact.",
      },
      {
        id: "step_2_2",
        name: "Intent Classification & Routing",
        stage: "intent_classification",
        status: "completed",
        agent: "Intent Agent",
        durationMs: 22.4,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20).toISOString(),
        summary: "Classified category as 'bug report'. Required web search: true (developer SDK protocol specifications).",
      },
      {
        id: "step_2_3",
        name: "Semantic Knowledge Base Matching",
        stage: "kb_retrieval",
        status: "completed",
        agent: "Knowledge Agent",
        durationMs: 9.1,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 50).toISOString(),
        summary: "Internal KB search returned no direct match above 15% threshold.",
      },
      {
        id: "step_2_4",
        name: "Web Search Grounding",
        stage: "web_search",
        status: "completed",
        agent: "Search Agent",
        durationMs: 148.2,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60).toISOString(),
        summary: "Executed live search for 'Node express rawBody HMAC signature verification' (retrieved 2 URLs).",
      },
      {
        id: "step_2_5",
        name: "Multi-Model AI Synthesis",
        stage: "ai_synthesis",
        status: "completed",
        agent: "Response Agent (Groq)",
        durationMs: 262.4,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 210).toISOString(),
        summary: "Synthesized developer guidance via Groq LLaMA-3.3-70B. Prompt tokens: 960, completion tokens: 280.",
      },
      {
        id: "step_2_6",
        name: "Guardrails & Operational Cost Accounting",
        stage: "guardrails_evaluation",
        status: "completed",
        agent: "Guardrails & Accounting",
        durationMs: 1.5,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 475).toISOString(),
        summary: "Blended confidence: 45%. Triggered automated Tier-2 human escalation protocol due to critical customer urgency.",
      }
    ],
    escalation: {
      recommendedResponse: "Hi Bob, I have escalated your issue to our developer integration team. Webhook signature failures are often caused by body parser middleware stripping raw bodies. In Express, you can capture this buffer via: `bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } })`. A team member will inspect your code configuration and reach out shortly.",
      suggestedActions: [
        "Inspect if developer backend captures raw body buffer",
        "Verify webhooks signing key matching sandbox vs production",
        "Send webhook debugging guide to Bob's email"
      ]
    }
  },
  {
    id: "t_3",
    title: "Thanks for resolving our login problem",
    customerName: "Charlie Green",
    customerEmail: "charlie@company.com",
    status: "resolved",
    sentiment: "positive",
    intentCategory: "general",
    intentSummary: "Customer confirms successful client secret generation and resolves OAuth ticket.",
    confidenceScore: 0.96,
    confidenceBreakdown: "1 KB article confirmed, resolution confirmed by customer, 95% model confidence",
    sourceCount: 1,
    sources: [],
    retrievalStatus: "success",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg_3_1",
        sender: "customer",
        text: "The guidance you sent regarding generating the client secret worked perfectly. We have successfully logged in via OAuth now. Thanks for the quick support!",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg_3_2",
        sender: "ai",
        text: "You are very welcome Charlie! I'm glad to hear your OAuth setup is working. I will mark this ticket as resolved. Let us know if you need any other assistance.",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 5000).toISOString(),
      }
    ],
    workflowSteps: [
      { agent: "Intent Agent", status: "completed", output: "[general] Customer confirmation of successful resolution and positive gratitude." },
      { agent: "Knowledge Agent", status: "completed", output: "Matched resolution history with 'How to retrieve a Scalekit client secret'." },
      { agent: "Search Agent", status: "completed", output: "Skipped external search for ticket resolution acknowledgment." },
      { agent: "Response Agent", status: "completed", output: "Drafted closure message and auto-marked ticket as resolved." }
    ],
    telemetry: {
      requestId: "req_init_t3",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      provider: "gemini",
      model: "gemini-1.5-flash",
      promptTokens: 420,
      completionTokens: 85,
      totalTokens: 505,
      isTokenCountEstimated: false,
      costUsd: 0.000057,
      formattedCost: "$0.000057 USD",
      latencies: {
        totalMs: 185.3,
        intentMs: 14.2,
        kbMs: 4.1,
        searchMs: 0.0,
        modelMs: 167.0,
      }
    },
    detailedSteps: [
      {
        id: "step_3_1",
        name: "Ticket Ingestion & Sentiment Analysis",
        stage: "ingestion",
        status: "completed",
        agent: "Ingestion Agent",
        durationMs: 1.2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        summary: "Ingested customer note. Detected positive gratitude and successful resolution.",
      },
      {
        id: "step_3_2",
        name: "Intent Classification & Routing",
        stage: "intent_classification",
        status: "completed",
        agent: "Intent Agent",
        durationMs: 14.2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 10).toISOString(),
        summary: "Classified as 'general' gratitude. Web search skipped.",
      },
      {
        id: "step_3_3",
        name: "Semantic Knowledge Base Matching",
        stage: "kb_retrieval",
        status: "completed",
        agent: "Knowledge Agent",
        durationMs: 4.1,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30).toISOString(),
        summary: "Linked resolution with 'How to retrieve a Scalekit client secret'.",
      },
      {
        id: "step_3_4",
        name: "Web Search Grounding Decision",
        stage: "web_search",
        status: "skipped",
        agent: "Search Agent",
        durationMs: 0.0,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 40).toISOString(),
        summary: "External search not required for customer resolution acknowledgment.",
      },
      {
        id: "step_3_5",
        name: "Multi-Model AI Synthesis",
        stage: "ai_synthesis",
        status: "completed",
        agent: "Response Agent (Gemini)",
        durationMs: 167.0,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 50).toISOString(),
        summary: "Formulated warm closing acknowledgment. Input tokens: 420, output tokens: 85.",
      },
      {
        id: "step_3_6",
        name: "Guardrails & Operational Cost Accounting",
        stage: "guardrails_evaluation",
        status: "completed",
        agent: "Guardrails & Accounting",
        durationMs: 1.0,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000 + 220).toISOString(),
        summary: "Blended confidence: 96%. Auto-marked ticket as resolved. Cost: $0.000057 USD.",
      }
    ]
  }
];

const DEFAULT_TELEMETRY: TelemetryRecord[] = [
  {
    requestId: "req_init_t1",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    provider: "gemini",
    actualModel: "gemini-1.5-flash",
    promptTokens: 840,
    completionTokens: 210,
    totalTokens: 1050,
    isTokenCountEstimated: false,
    estimatedCostUsd: 0.000126,
    outcome: "success",
    latencies: {
      totalMs: 382.4,
      intentMs: 24.1,
      kbMs: 8.6,
      searchMs: 0.0,
      modelMs: 349.7,
    },
    ticketId: "t_1",
  },
  {
    requestId: "req_init_t2",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    provider: "groq",
    actualModel: "llama-3.3-70b-versatile",
    promptTokens: 960,
    completionTokens: 280,
    totalTokens: 1240,
    isTokenCountEstimated: false,
    estimatedCostUsd: 0.000788,
    outcome: "fallback",
    latencies: {
      totalMs: 442.1,
      intentMs: 22.4,
      kbMs: 9.1,
      searchMs: 148.2,
      modelMs: 262.4,
    },
    ticketId: "t_2",
  },
  {
    requestId: "req_init_t3",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    provider: "gemini",
    actualModel: "gemini-1.5-flash",
    promptTokens: 420,
    completionTokens: 85,
    totalTokens: 505,
    isTokenCountEstimated: false,
    estimatedCostUsd: 0.000057,
    outcome: "success",
    latencies: {
      totalMs: 185.3,
      intentMs: 14.2,
      kbMs: 4.1,
      searchMs: 0.0,
      modelMs: 167.0,
    },
    ticketId: "t_3",
  }
];

export class SimpleDB {
  private state: DBState = { articles: [], tickets: [], telemetry: [] };
  private isWriting = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.state = {
          articles: Array.isArray(parsed.articles) ? parsed.articles : [...DEFAULT_ARTICLES],
          tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [...DEFAULT_TICKETS],
          telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : [],
        };
      } else {
        this.state = {
          articles: [...DEFAULT_ARTICLES],
          tickets: [...DEFAULT_TICKETS],
          telemetry: [],
        };
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB state:", e);
      this.state = { articles: [...DEFAULT_ARTICLES], tickets: [...DEFAULT_TICKETS], telemetry: [] };
    }
  }

  // Atomic file write to avoid corrupted JSON on unexpected crash
  private save() {
    if (this.isWriting) {
      // Defer slightly if another write is in progress
      setTimeout(() => this.save(), 50);
      return;
    }

    this.isWriting = true;
    try {
      const data = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(DB_TMP_FILE, data, "utf-8");
      fs.renameSync(DB_TMP_FILE, DB_FILE);
    } catch (e) {
      console.error("Failed to atomically save local DB state:", e);
    } finally {
      this.isWriting = false;
    }
  }

  // -------------------------------------------------------------------------
  // Articles CRUD
  // -------------------------------------------------------------------------
  getArticles(): KBArticle[] {
    return this.state.articles;
  }

  getArticleById(id: string): KBArticle | undefined {
    return this.state.articles.find((art) => art.id === id);
  }

  addArticle(article: Omit<KBArticle, "id" | "createdAt" | "updatedAt">): KBArticle {
    const now = new Date().toISOString();
    const newArt: KBArticle = {
      ...article,
      id: "kb_" + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    this.state.articles.push(newArt);
    this.save();
    return newArt;
  }

  updateArticle(
    id: string,
    updates: Partial<Omit<KBArticle, "id" | "createdAt">>
  ): KBArticle | null {
    const index = this.state.articles.findIndex((art) => art.id === id);
    if (index === -1) return null;

    this.state.articles[index] = {
      ...this.state.articles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.state.articles[index];
  }

  deleteArticle(id: string): boolean {
    const initialLen = this.state.articles.length;
    this.state.articles = this.state.articles.filter((art) => art.id !== id);
    if (this.state.articles.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Tickets CRUD
  // -------------------------------------------------------------------------
  getTickets(): Ticket[] {
    return this.state.tickets;
  }

  getTicketById(id: string): Ticket | undefined {
    return this.state.tickets.find((t) => t.id === id);
  }

  createTicket(ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt">): Ticket {
    const now = new Date().toISOString();
    const newTicket: Ticket = {
      ...ticket,
      id: "t_" + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    this.state.tickets.unshift(newTicket);
    this.save();
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<Omit<Ticket, "id" | "createdAt">>): Ticket | null {
    const index = this.state.tickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.state.tickets[index] = {
      ...this.state.tickets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Ticket;
    this.save();
    return this.state.tickets[index];
  }

  addMessageToTicket(
    ticketId: string,
    message: Omit<TicketMessage, "id" | "createdAt">
  ): Ticket | null {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return null;

    const newMsg: TicketMessage = {
      ...message,
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    // Update ticket title if it was empty
    if (!ticket.title && message.sender === "customer") {
      ticket.title = message.text.split("\n")[0].slice(0, 50);
    }

    this.save();
    return ticket;
  }

  // -------------------------------------------------------------------------
  // Telemetry & Operational Metrics
  // -------------------------------------------------------------------------
  recordTelemetry(record: TelemetryRecord) {
    this.state.telemetry.unshift(record);
    // Keep last 1,000 telemetry entries to prevent unlimited growth
    if (this.state.telemetry.length > 1000) {
      this.state.telemetry = this.state.telemetry.slice(0, 1000);
    }
    this.save();
  }

  getTelemetryMetrics() {
    const logs = this.state.telemetry;
    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.outcome === "success").length;
    const failedRequests = logs.filter((l) => l.outcome === "failed").length;
    const fallbackRequests = logs.filter((l) => l.outcome === "fallback").length;

    const totalTokens = logs.reduce((acc, l) => acc + (l.totalTokens || 0), 0);
    const promptTokens = logs.reduce((acc, l) => acc + (l.promptTokens || 0), 0);
    const completionTokens = logs.reduce((acc, l) => acc + (l.completionTokens || 0), 0);

    const totalCostUsd = Number(
      logs.reduce((acc, l) => acc + (l.estimatedCostUsd || 0), 0).toFixed(4)
    );

    const latencies = logs.map((l) => l.latencies?.totalMs || 0).filter((ms) => ms > 0);
    const avgLatencyMs = latencies.length > 0
      ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1))
      : 0;

    const p50LatencyMs = calculatePercentile(latencies, 50);
    const p95LatencyMs = calculatePercentile(latencies, 95);

    // Provider distribution
    const providerDist: Record<string, number> = {};
    logs.forEach((l) => {
      providerDist[l.provider] = (providerDist[l.provider] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      fallbackRequests,
      totalTokens,
      promptTokens,
      completionTokens,
      totalCostUsd,
      avgLatencyMs,
      p50LatencyMs,
      p95LatencyMs,
      sampleSize: latencies.length,
      providerDistribution: providerDist,
      recentLogs: logs.slice(0, 20),
    };
  }

  // -------------------------------------------------------------------------
  // High-Level Ticket Analytics
  // -------------------------------------------------------------------------
  getAnalytics() {
    const tickets = this.state.tickets;
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const escalated = tickets.filter((t) => t.status === "escalated").length;
    const open = tickets.filter((t) => t.status === "open" || t.status === "pending").length;

    const totalConf = tickets.reduce((acc, t) => acc + t.confidenceScore, 0);
    const avgConfidence = total > 0 ? Number((totalConf / total).toFixed(2)) : 0;

    // Top issues count
    const topics: Record<string, number> = {};
    tickets.forEach((t) => {
      if (t.intentCategory) {
        const catName = t.intentCategory.charAt(0).toUpperCase() + t.intentCategory.slice(1);
        topics[catName] = (topics[catName] || 0) + 1;
      } else {
        const title = t.title.toLowerCase();
        if (title.includes("oauth") || title.includes("redirect") || title.includes("sso")) {
          topics["Technical/Integration"] = (topics["Technical/Integration"] || 0) + 1;
        } else if (title.includes("signature") || title.includes("webhook")) {
          topics["Bug report"] = (topics["Bug report"] || 0) + 1;
        } else if (title.includes("secret") || title.includes("key")) {
          topics["Account/Access"] = (topics["Account/Access"] || 0) + 1;
        } else {
          topics["General"] = (topics["General"] || 0) + 1;
        }
      }
    });

    const topIssues = Object.entries(topics).map(([name, count]) => ({ name, count }));

    // Resolution trends over past 7 days
    const trends: Record<string, { resolved: number; escalated: number; total: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trends[dateString] = { resolved: 0, escalated: 0, total: 0 };
    }

    tickets.forEach((t) => {
      const dateString = new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (trends[dateString]) {
        trends[dateString].total++;
        if (t.status === "resolved") trends[dateString].resolved++;
        if (t.status === "escalated") trends[dateString].escalated++;
      }
    });

    const resolutionTrends = Object.entries(trends).map(([date, metrics]) => ({
      date,
      ...metrics,
    }));

    return {
      totalTickets: total,
      resolvedTickets: resolved,
      escalatedTickets: escalated,
      openTickets: open,
      averageConfidence: avgConfidence,
      topIssues,
      resolutionTrends,
    };
  }

  // -------------------------------------------------------------------------
  // Data Reset & Clean Slate
  // -------------------------------------------------------------------------
  resetState(cleanSeed = true) {
    this.state.tickets = cleanSeed ? JSON.parse(JSON.stringify(DEFAULT_TICKETS)) : [];
    this.state.telemetry = cleanSeed ? JSON.parse(JSON.stringify(DEFAULT_TELEMETRY)) : [];
    this.state.articles = JSON.parse(JSON.stringify(DEFAULT_ARTICLES));
    this.save();
    return {
      tickets: this.state.tickets,
      articles: this.state.articles,
      telemetry: this.state.telemetry,
    };
  }

  clearTickets() {
    this.state.tickets = [];
    this.state.telemetry = [];
    this.save();
    return [];
  }
}

export const db = new SimpleDB();
