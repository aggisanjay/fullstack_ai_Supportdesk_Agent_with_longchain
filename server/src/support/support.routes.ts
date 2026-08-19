import { Router } from "express";
import { 
  DraftSchema, 
  Provider, 
  RequestSchema, 
  KBArticleSchema, 
  TicketUpdateSchema,
  IntentSchema,
  IntentClassification
} from "./support.schema";
import { createAgent } from "langchain";
import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { TavilyResult, tavilySearch } from "./tavily";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { db, KBArticle, Ticket, TicketMessage, WorkflowStep } from "./db";

const router = Router();

const AgentState = new StateSchema({ messages: MessagesValue });

function makeAgent(provider: Provider) {
  let model: any;

  if (provider === "groq") {
    model = new ChatOpenAI({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
      temperature: 0.2,
      maxRetries: 1,
    });
  } else if (provider === "openai") {
    model = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
    });
  } else {
    model = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      maxRetries: 1,
    });
  }

  return createAgent({
    model,
    stateSchema: AgentState,
    tools: [],
    responseFormat: DraftSchema,
    systemPrompt: "Return strict JSON only. No Markdown. No extra keys.",
  });
}

function parseJsonFromLlm(text: string) {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Invalid JSON from model");
  }
}

// ---------------------------------------------------------------------------
// 1) REAL INTENT CLASSIFICATION & AGENT SEARCH DECISION
// ---------------------------------------------------------------------------
async function classifyIntentAndSearchDecision(
  ticketText: string,
  provider: Provider
): Promise<IntentClassification> {
  const prompt = [
    "You are an expert customer support triager.",
    "Analyze the customer ticket and classify its intent category, customer need summary, and search requirements.",
    "",
    "Output ONLY a strict JSON object with this exact shape:",
    "{",
    '  "intentCategory": "billing" | "technical/integration" | "account/access" | "bug report" | "feature request" | "general",',
    '  "intentSummary": "1 clear sentence describing what the customer actually needs",',
    '  "requiresWebSearch": true | false,',
    '  "searchReasoning": "1 clear sentence explaining why external web search is or is not required"',
    "}",
    "",
    "Categorization Rules:",
    "- 'technical/integration': APIs, SDKs, OAuth, Webhooks, HMAC, SSO, SAML, Redirect URIs, Tokens, Node, React, Express, Scalekit.",
    "- 'bug report': Unexpected errors, 500, crash, failed signature, broken endpoint, exceptions, timeout.",
    "- 'billing': Invoices, pricing, charges, refunds, tier upgrades, credit cards, subscription.",
    "- 'account/access': Login, passwords, 2FA, invitation emails, roles, team members.",
    "- 'feature request': Asking for new capabilities or integrations not yet available.",
    "- 'general': General inquiries, greetings, or closure notes.",
    "- requiresWebSearch MUST be true for technical/integration and bug reports involving developer code/protocols.",
    "",
    `Customer Ticket:\n"${ticketText}"`
  ].join("\n");

  try {
    // 1. Try Groq if available (super fast)
    if (process.env.GROQ_API_KEY) {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      if (groqRes.ok) {
        const data = await groqRes.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return IntentSchema.parse(parseJsonFromLlm(content));
        }
      }
    }

    // 2. Try Gemini
    if (process.env.GEMINI_API_KEY) {
      const chat = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.1,
        maxRetries: 1,
      });
      const response = await chat.invoke(prompt);
      const contentStr = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      return IntentSchema.parse(parseJsonFromLlm(contentStr));
    }

    // 3. Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      const chat = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.1,
        maxRetries: 1,
      });
      const response = await chat.invoke(prompt);
      const contentStr = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      return IntentSchema.parse(parseJsonFromLlm(contentStr));
    }
  } catch (err) {
    console.warn("LLM intent classifier fallback to pattern matcher:", err);
  }

  // Robust pattern matcher
  return fallbackIntentClassifier(ticketText);
}

function fallbackIntentClassifier(ticket: string): IntentClassification {
  const lower = ticket.toLowerCase();

  if (/\b(invoice|billing|receipt|charge|pricing|refund|subscription|cost|tier|upgrade|credit\s*card|vat)\b/.test(lower)) {
    return {
      intentCategory: "billing",
      intentSummary: "Customer is requesting billing statements, payment method updates, or plan pricing assistance.",
      requiresWebSearch: false,
      searchReasoning: "Billing inquiries are internal account matters and do not require external web research.",
    };
  }

  if (/\b(error|bug|broken|crash|exception|500|400|401|403|404|fails?|failing|failure|timingsafeequal|mismatch|broken|timeout)\b/.test(lower)) {
    return {
      intentCategory: "bug report",
      intentSummary: "Customer is reporting a technical error or signature verification failure in their integration.",
      requiresWebSearch: true,
      searchReasoning: "Technical debugging error requires live external developer documentation and syntax verification.",
    };
  }

  if (/\b(oauth|oidc|redirect_uri|redirect|callback|webhook|hmac|signature|sdk|api|sso|saml|token|scalekit|express|node|react|endpoint)\b/.test(lower)) {
    return {
      intentCategory: "technical/integration",
      intentSummary: "Customer is configuring API, OAuth authentication, or webhook callbacks in their application.",
      requiresWebSearch: true,
      searchReasoning: "Technical protocol integration benefits from current developer SDK specifications.",
    };
  }

  if (/\b(password|login|2fa|mfa|account|reset|invite|member|access|credentials?|secret)\b/.test(lower)) {
    return {
      intentCategory: "account/access",
      intentSummary: "Customer is requesting account recovery, secret credential retrieval, or user permissions help.",
      requiresWebSearch: false,
      searchReasoning: "Account access protocols are covered directly by internal admin documentation.",
    };
  }

  if (/\b(feature|support for|add|request|roadmap|when will|can we)\b/.test(lower)) {
    return {
      intentCategory: "feature request",
      intentSummary: "Customer is requesting new platform feature support or workflow enhancements.",
      requiresWebSearch: false,
      searchReasoning: "Feature availability requests are evaluated against current product roadmap.",
    };
  }

  if (/\b(thanks?|thank you|solved|resolved|working now|awesome|great|closing)\b/.test(lower)) {
    return {
      intentCategory: "general",
      intentSummary: "Customer is confirming successful resolution of their issue with positive feedback.",
      requiresWebSearch: false,
      searchReasoning: "Resolution confirmation and gratitude notes do not require search grounding.",
    };
  }

  return {
    intentCategory: "general",
    intentSummary: ticket.slice(0, 80) + (ticket.length > 80 ? "..." : ""),
    requiresWebSearch: false,
    searchReasoning: "General customer inquiry addressed directly through standard support runbooks.",
  };
}

// ---------------------------------------------------------------------------
// 2) KNOWLEDGE SEARCH WITH COSINE TF-IDF VECTOR SIMILARITY
// ---------------------------------------------------------------------------
export interface KBSearchResult {
  article: KBArticle;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function searchKBCosine(query: string): KBSearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const articles = db.getArticles();
  if (articles.length === 0) return [];

  const queryFreq: Record<string, number> = {};
  queryTokens.forEach((t) => {
    queryFreq[t] = (queryFreq[t] || 0) + 1;
  });

  const queryNorm = Math.sqrt(
    Object.values(queryFreq).reduce((sum, v) => sum + v * v, 0)
  );

  const results: KBSearchResult[] = [];

  for (const art of articles) {
    const titleTokens = tokenize(art.title);
    const contentTokens = tokenize(art.content);

    const docFreq: Record<string, number> = {};
    titleTokens.forEach((t) => {
      docFreq[t] = (docFreq[t] || 0) + 3;
    });
    contentTokens.forEach((t) => {
      docFreq[t] = (docFreq[t] || 0) + 1;
    });

    const docNorm = Math.sqrt(
      Object.values(docFreq).reduce((sum, v) => sum + v * v, 0)
    );

    if (docNorm === 0 || queryNorm === 0) continue;

    let dotProduct = 0;
    for (const [token, qCount] of Object.entries(queryFreq)) {
      if (docFreq[token]) {
        dotProduct += qCount * docFreq[token];
      }
    }

    const cosineScore = dotProduct / (queryNorm * docNorm);
    const normalizedScore = Number(Math.min(1.0, Math.max(0, cosineScore * 1.3)).toFixed(2));

    if (normalizedScore >= 0.15) {
      results.push({
        article: art,
        score: normalizedScore,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 2);
}

function extractSearchQuery(ticketText: string, intentSummary?: string): string {
  // Extract key technical tokens
  const lower = ticketText.toLowerCase();
  const keywords: string[] = [];

  if (lower.includes("scalekit")) keywords.push("Scalekit");
  if (lower.includes("oauth")) keywords.push("OAuth");
  if (lower.includes("redirect_uri") || lower.includes("redirect")) keywords.push("redirect URI");
  if (lower.includes("webhook")) keywords.push("webhook");
  if (lower.includes("hmac") || lower.includes("signature")) keywords.push("HMAC signature verification");
  if (lower.includes("express") || lower.includes("node")) keywords.push("Node.js Express");
  if (lower.includes("timingsafeequal")) keywords.push("crypto.timingSafeEqual");

  if (keywords.length > 0) {
    return keywords.join(" ");
  }

  // Fallback: clean prompt text
  return ticketText
    .replace(/^(hi|hello|hey|dear support|please help|can you help|thanks)[^,.\n]*[,.\n]/i, "")
    .replace(/[^\w\s\-_.:/]/g, " ")
    .trim()
    .slice(0, 100);
}

function formatSearchResults(results: TavilyResult[]) {
  if (!results.length) return "none";

  return results
    .map((res, index) => {
      const snip = res.snippet?.trim() ? res.snippet.trim() : "no snippet";
      return `#${index + 1} ${res.title}\n${res.url}\n${snip}`;
    })
    .join("\n\n");
}

function createPrompt(args: { 
  ticket: string; 
  searchResults: TavilyResult[]; 
  kbResults: KBSearchResult[];
  intent: IntentClassification;
}) {
  const hasSearchResult = args.searchResults.length > 0;
  const hasKbResult = args.kbResults.length > 0;

  const kbFormatted = hasKbResult
    ? args.kbResults
        .map((k, index) => `#${index + 1} [${k.article.category}] ${k.article.title} (Relevance: ${(k.score * 100).toFixed(0)}%)\n${k.article.content}`)
        .join("\n\n")
    : "none";

  return [
    "You are an expert B2B customer support agent.",
    "Write a clear, context-grounded, empathetic response to the customer.",
    "",
    "Output ONLY strict JSON with this exact shape:",
    '{ "reply": string, "sources": string[], "sentiment": "positive"|"neutral"|"frustrated"|"critical", "confidenceScore": number }',
    "",
    "Rules:",
    "- Be polite, concise, with clean paragraph breaks.",
    "- Directly resolve the customer query using the provided knowledge base articles or web search results.",
    "- Ask for necessary missing config/logs if required.",
    "- Do NOT make unauthorized guarantees.",
    "- sentiment must accurately reflect customer mood (positive, neutral, frustrated, critical).",
    "- confidenceScore must be a number between 0.0 and 1.0 reflecting how fully the provided context answers the ticket.",
    hasSearchResult
      ? "- IMPORTANT: sources[] MUST contain 1 to 3 URLs copied from the 'Web Search Grounding Results' section below."
      : "- sources[] MUST be [].",
    "",
    `Classified Intent Category: ${args.intent.intentCategory}`,
    `Classified Intent Summary: ${args.intent.intentSummary}`,
    "",
    "Grounding Knowledge Base Matches:",
    kbFormatted,
    "",
    "Web Search Grounding Results:",
    formatSearchResults(args.searchResults),
    "",
    "Customer Ticket:",
    args.ticket,
  ].join("\n");
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function isHttpUrl(input: string) {
  try {
    const check = new URL(input);
    return check.protocol === "http:" || check.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3) SUPPORT RUN ROUTE (AGENT ORCHESTRATION PIPELINE)
// ---------------------------------------------------------------------------
router.post("/run", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { provider, text, ticketId } = parsed.data;
  const ticketText = text.trim();

  // Step 1: Real Intent Classification
  const intent = await classifyIntentAndSearchDecision(ticketText, provider);
  const workflowSteps: WorkflowStep[] = [
    {
      agent: "Intent Agent",
      status: "completed",
      output: `[${intent.intentCategory}] ${intent.intentSummary}`,
    },
  ];

  // Step 2: Knowledge Vector Search
  const kbMatches = searchKBCosine(ticketText);
  const kbResults = kbMatches.map((m) => m.article);
  const maxKbScore = kbMatches.length > 0 ? kbMatches[0].score : 0;

  workflowSteps.push({
    agent: "Knowledge Agent",
    status: "completed",
    output: kbMatches.length > 0 
      ? `Retrieved ${kbMatches.length} internal article(s). Top match: '${kbMatches[0].article.title}' (${(maxKbScore * 100).toFixed(0)}% relevance).`
      : "Knowledge search executed. No direct internal runbook matched (threshold < 15%).",
  });

  // Step 3: Agent Web Search Decision
  const doWebSearch = intent.requiresWebSearch;
  let searchResults: TavilyResult[] = [];

  try {
    if (doWebSearch) {
      const searchQuery = extractSearchQuery(ticketText, intent.intentSummary);
      searchResults = await tavilySearch({ query: searchQuery });
      workflowSteps.push({
        agent: "Search Agent",
        status: "completed",
        output: searchResults.length > 0
          ? `Executed live search for '${searchQuery}'. (Retrieved ${searchResults.length} URLs from Tavily).`
          : `Executed live search for '${searchQuery}', but search returned 0 results.`,
      });
    } else {
      workflowSteps.push({
        agent: "Search Agent",
        status: "completed",
        output: `Skipped external web search. ${intent.searchReasoning}`,
      });
    }
  } catch {
    searchResults = [];
    workflowSteps.push({
      agent: "Search Agent",
      status: "failed",
      output: "Search Agent encountered network timeout communicating with Tavily.",
    });
  }

  try {
    let draft: any;

    if (provider === "groq" && process.env.GROQ_API_KEY) {
      const prompt = createPrompt({ 
        ticket: ticketText, 
        searchResults, 
        kbResults: kbMatches,
        intent 
      });

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert customer support agent. Output ONLY a valid JSON object matching the requested schema." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API returned error ${groqRes.status}`);
      }

      const groqData = await groqRes.json() as any;
      const content = groqData.choices?.[0]?.message?.content;
      draft = DraftSchema.parse(parseJsonFromLlm(content));
    } else {
      const agent = makeAgent(provider);
      const prompt = createPrompt({ 
        ticket: ticketText, 
        searchResults, 
        kbResults: kbMatches,
        intent 
      });

      let out;
      try {
        out = await agent.invoke({
          messages: [{ role: "user", content: prompt }],
        });
        draft = DraftSchema.parse(out.structuredResponse);
      } catch (geminiErr) {
        if (process.env.GROQ_API_KEY) {
          console.warn("Primary agent failed, falling back to Groq:", geminiErr);

          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are a helpful support agent. Output ONLY a valid JSON object matching the requested schema." },
                { role: "user", content: prompt }
              ],
              temperature: 0.2,
              response_format: { type: "json_object" }
            })
          });

          if (!groqResponse.ok) {
            throw new Error(`Groq API returned error status: ${groqResponse.status}`);
          }

          const groqData = (await groqResponse.json()) as any;
          const content = groqData.choices?.[0]?.message?.content;
          draft = DraftSchema.parse(parseJsonFromLlm(content));

          workflowSteps.push({
            agent: "Fallback Agent (Groq)",
            status: "completed",
            output: "Fell back to Groq LLaMA-3.3-70B model for response synthesis.",
          });
        } else {
          throw geminiErr;
        }
      }
    }

    let sources = uniq(draft.sources).filter(
      (source: any) => typeof source === "string",
    );
    sources = sources.filter(isHttpUrl).slice(0, 3);

    // Auto-populate sources if web search ran and returned results
    if (doWebSearch && searchResults.length > 0 && sources.length === 0) {
      sources = searchResults.map(r => r.url).filter(isHttpUrl).slice(0, 3);
    }

    // -----------------------------------------------------------------------
    // 4) HYBRID DEFENSIBLE CONFIDENCE CALCULATION
    // -----------------------------------------------------------------------
    const llmConfidence = draft.confidenceScore || 0.8;
    
    let retrievalScore = 0.35;
    if (kbMatches.length > 0) {
      retrievalScore = Math.min(1.0, maxKbScore * 0.95 + 0.1);
    } else if (searchResults.length > 0) {
      retrievalScore = 0.82;
    } else if (!intent.requiresWebSearch) {
      retrievalScore = 0.88;
    }

    const blendedConfidence = Number(
      Math.min(0.98, Math.max(0.2, (0.55 * retrievalScore) + (0.45 * llmConfidence))).toFixed(2)
    );

    const confidenceBreakdown = `${kbMatches.length} KB articles matched (top match: ${(maxKbScore * 100).toFixed(0)}%), ${sources.length} web sources, model confidence: ${(llmConfidence * 100).toFixed(0)}%`;

    workflowSteps.push({
      agent: "Response Agent",
      status: "completed",
      output: `Drafted response with sentiment '${draft.sentiment}' and blended confidence ${(blendedConfidence * 100).toFixed(0)}% (${confidenceBreakdown}).`,
    });

    const retrievalStatus = kbResults.length > 0 || sources.length > 0 ? "success" : "none";
    const sourceCount = kbResults.length + sources.length;

    // Ticketing Lifecycle Save
    let ticket: Ticket;

    if (ticketId) {
      const existing = db.getTicketById(ticketId);
      if (existing) {
        db.addMessageToTicket(ticketId, {
          sender: "customer",
          text: ticketText,
        });
        db.addMessageToTicket(ticketId, {
          sender: "ai",
          text: draft.reply,
        });
        
        const updatePayload: Partial<Ticket> = {
          sentiment: draft.sentiment,
          intentCategory: intent.intentCategory,
          intentSummary: intent.intentSummary,
          confidenceScore: blendedConfidence,
          confidenceBreakdown,
          sourceCount,
          sources,
          retrievalStatus,
          workflowSteps,
        };

        if (blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated") {
          updatePayload.status = "escalated";
          updatePayload.escalation = {
            recommendedResponse: `Hi ${existing.customerName}, I'm escalating your query to our technical team for immediate help. In the meantime, based on our guidelines:\n\n${draft.reply}`,
            suggestedActions: [
              "Review user logs in Scalekit dashboard",
              "Check raw body parser buffer implementation on customer server",
              "Contact user via secondary email"
            ],
          };
        } else {
          updatePayload.status = "pending";
        }

        ticket = db.updateTicket(ticketId, updatePayload)!;
      } else {
        ticket = createNewTicketHelper();
      }
    } else {
      ticket = createNewTicketHelper();
    }

    function createNewTicketHelper(): Ticket {
      const customerName = req.user?.name || "API Developer";
      const customerEmail = req.user?.email || "developer@example.com";

      const t = db.createTicket({
        title: ticketText.slice(0, 50) + (ticketText.length > 50 ? "..." : ""),
        customerName,
        customerEmail,
        status: "open",
        sentiment: draft.sentiment,
        intentCategory: intent.intentCategory,
        intentSummary: intent.intentSummary,
        confidenceScore: blendedConfidence,
        confidenceBreakdown,
        sourceCount,
        sources,
        retrievalStatus,
        messages: [
          { id: "m1", sender: "customer", text: ticketText, createdAt: new Date().toISOString() },
          { id: "m2", sender: "ai", text: draft.reply, createdAt: new Date().toISOString() }
        ],
        workflowSteps,
      });

      if (blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated") {
        db.updateTicket(t.id, {
          status: "escalated",
          escalation: {
            recommendedResponse: `Hi ${customerName}, I have escalated this ticket. A support engineer is reviewing your request. Below is the preliminary automated advice:\n\n${draft.reply}`,
            suggestedActions: [
              "Examine raw integration config for errors",
              "Verify domain permissions for the organization",
              "Schedule video-call support triage"
            ]
          }
        });
      }

      return db.getTicketById(t.id)!;
    }

    return res.json({
      reply: draft.reply,
      sources: doWebSearch && searchResults.length > 0 ? sources : [],
      ticketId: ticket.id,
      sentiment: draft.sentiment,
      intentCategory: intent.intentCategory,
      intentSummary: intent.intentSummary,
      confidenceScore: blendedConfidence,
      confidenceBreakdown,
      workflowSteps,
      escalation: ticket.escalation,
      ticket,
    });
  } catch (err) {
    console.error("Agent error:", err);
    return res.status(500).json({
      error: "Source agent failed",
    });
  }
});

// Knowledge Base Routes
router.get("/kb", (req, res) => {
  res.json(db.getArticles());
});

router.post("/kb", (req, res) => {
  const parsed = KBArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid article shape" });
  }

  const created = db.addArticle(parsed.data);
  res.status(201).json(created);
});

router.delete("/kb/:id", (req, res) => {
  const deleted = db.deleteArticle(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Article not found" });
  }
  res.json({ ok: true });
});

// Ticket Management Routes
router.get("/tickets", (req, res) => {
  res.json(db.getTickets());
});

router.get("/tickets/:id", (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json(ticket);
});

router.patch("/tickets/:id", (req, res) => {
  const parsed = TicketUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status update" });
  }

  const updated = db.updateTicket(req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json(updated);
});

router.post("/tickets", (req, res) => {
  const { title, customerName, customerEmail, status, text } = req.body;
  if (!title || !customerEmail || !text) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const t = db.createTicket({
    title,
    customerName: customerName || "Customer",
    customerEmail,
    status: status || "open",
    sentiment: "neutral",
    intentCategory: "general",
    intentSummary: title,
    confidenceScore: 0.95,
    confidenceBreakdown: "Manually registered inbound ticket",
    sourceCount: 0,
    retrievalStatus: "none",
    messages: [
      { id: "m1", sender: "customer", text, createdAt: new Date().toISOString() }
    ],
    workflowSteps: []
  });

  res.status(201).json(t);
});

// Support Analytics Dashboard Route
router.get("/analytics", (req, res) => {
  res.json(db.getAnalytics());
});

export default router;
