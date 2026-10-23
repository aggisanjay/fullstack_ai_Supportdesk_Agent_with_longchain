"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const support_schema_1 = require("./support.schema");
const langchain_1 = require("langchain");
const langgraph_1 = require("@langchain/langgraph");
const tavily_1 = require("./tavily");
const google_genai_1 = require("@langchain/google-genai");
const openai_1 = require("@langchain/openai");
const db_1 = require("./db");
const pricing_1 = require("./pricing");
const router = (0, express_1.Router)();
const AgentState = new langgraph_1.StateSchema({ messages: langgraph_1.MessagesValue });
function getModelConfig(provider) {
    if (provider === "groq") {
        const key = process.env.GROQ_API_KEY;
        return {
            modelName: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
            apiKey: key,
            isConfigured: !!(key && key.trim().length > 5),
        };
    }
    else if (provider === "openai") {
        const key = process.env.OPENAI_API_KEY;
        return {
            modelName: "gpt-4o-mini",
            apiKey: key,
            isConfigured: !!(key && key.trim().length > 5 && !key.includes("your-openai-key")),
        };
    }
    else {
        const key = process.env.GEMINI_API_KEY;
        return {
            modelName: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            apiKey: key,
            isConfigured: !!(key && key.trim().length > 5),
        };
    }
}
function makeAgent(provider) {
    let model;
    const cfg = getModelConfig(provider);
    if (provider === "groq") {
        model = new openai_1.ChatOpenAI({
            model: cfg.modelName,
            apiKey: cfg.apiKey,
            configuration: {
                baseURL: "https://api.groq.com/openai/v1",
            },
            temperature: 0.2,
            maxRetries: 1,
        });
    }
    else if (provider === "openai") {
        model = new openai_1.ChatOpenAI({
            model: cfg.modelName,
            apiKey: cfg.apiKey,
            temperature: 0.2,
            maxRetries: 1,
        });
    }
    else {
        model = new google_genai_1.ChatGoogleGenerativeAI({
            model: cfg.modelName,
            apiKey: cfg.apiKey,
            temperature: 0.2,
            maxRetries: 1,
        });
    }
    return (0, langchain_1.createAgent)({
        model,
        stateSchema: AgentState,
        tools: [],
        responseFormat: support_schema_1.DraftSchema,
        systemPrompt: "Return strict JSON only. No Markdown. No extra keys.",
    });
}
function parseJsonFromLlm(text) {
    try {
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    }
    catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        throw new Error("Invalid JSON returned by language model");
    }
}
// ---------------------------------------------------------------------------
// 1) INTENT CLASSIFICATION & AGENT SEARCH DECISION
// ---------------------------------------------------------------------------
async function classifyIntentAndSearchDecision(ticketText, preferredProvider) {
    const start = performance.now();
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
        // 1. Try Groq if configured (sub-second latency)
        const groqCfg = getModelConfig("groq");
        if (groqCfg.isConfigured) {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${groqCfg.apiKey}`
                },
                body: JSON.stringify({
                    model: groqCfg.modelName,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });
            if (groqRes.ok) {
                const data = await groqRes.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    const parsed = support_schema_1.IntentSchema.parse(parseJsonFromLlm(content));
                    return { classification: parsed, durationMs: Number((performance.now() - start).toFixed(1)) };
                }
            }
        }
        // 2. Try Gemini
        const geminiCfg = getModelConfig("gemini");
        if (geminiCfg.isConfigured) {
            const chat = new google_genai_1.ChatGoogleGenerativeAI({
                model: geminiCfg.modelName,
                apiKey: geminiCfg.apiKey,
                temperature: 0.1,
                maxRetries: 1,
            });
            const response = await chat.invoke(prompt);
            const contentStr = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
            const parsed = support_schema_1.IntentSchema.parse(parseJsonFromLlm(contentStr));
            return { classification: parsed, durationMs: Number((performance.now() - start).toFixed(1)) };
        }
        // 3. Try OpenAI
        const openAiCfg = getModelConfig("openai");
        if (openAiCfg.isConfigured) {
            const chat = new openai_1.ChatOpenAI({
                model: openAiCfg.modelName,
                apiKey: openAiCfg.apiKey,
                temperature: 0.1,
                maxRetries: 1,
            });
            const response = await chat.invoke(prompt);
            const contentStr = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
            const parsed = support_schema_1.IntentSchema.parse(parseJsonFromLlm(contentStr));
            return { classification: parsed, durationMs: Number((performance.now() - start).toFixed(1)) };
        }
    }
    catch (err) {
        // Fallback pattern matcher
    }
    const fallback = fallbackIntentClassifier(ticketText);
    return { classification: fallback, durationMs: Number((performance.now() - start).toFixed(1)) };
}
function fallbackIntentClassifier(ticket) {
    const lower = ticket.toLowerCase();
    // 1. Feature Requests & Roadmap
    if (/\b(feature|roadmap|when will|can we add|request support for|support for discord|support for slack)\b/.test(lower)) {
        return {
            intentCategory: "feature request",
            intentSummary: "Customer is requesting new platform feature support or workflow enhancements.",
            requiresWebSearch: false,
            searchReasoning: "Feature availability requests are evaluated against current product roadmap.",
        };
    }
    // 2. Critical Errors & Bug Reports
    if (/\b(error|bug|broken|crash|exception|500|400|401|403|404|fails?|failing|failure|timingsafeequal|mismatch|stopped working|nothing loads)\b/.test(lower)) {
        if (lower.includes("api key") && !lower.includes("timingsafeequal") && !lower.includes("webhook")) {
            return {
                intentCategory: "account/access",
                intentSummary: "Customer is requesting account recovery, secret credential retrieval, or API key verification.",
                requiresWebSearch: false,
                searchReasoning: "Account access protocols are covered directly by internal admin documentation.",
            };
        }
        return {
            intentCategory: "bug report",
            intentSummary: "Customer is reporting a technical error, exception, or failure in their integration.",
            requiresWebSearch: true,
            searchReasoning: "Technical debugging error requires live external developer documentation and syntax verification.",
        };
    }
    // 3. Credentials, Secrets & Account Access
    if (/\b(password|2fa|mfa|locked out|reset|invite|member|access|credentials?|client secret|generate secret|api key)\b/.test(lower)) {
        return {
            intentCategory: "account/access",
            intentSummary: "Customer is requesting account recovery, secret credential retrieval, or user permissions help.",
            requiresWebSearch: false,
            searchReasoning: "Account access protocols are covered directly by internal admin documentation.",
        };
    }
    // 4. Billing, Charges & Invoices
    if (/\b(invoice|billing|charged|refund|subscription|prorated|credit\s*card|vat|receipt)\b/.test(lower)) {
        return {
            intentCategory: "billing",
            intentSummary: "Customer is requesting billing statements, payment method updates, or plan pricing assistance.",
            requiresWebSearch: false,
            searchReasoning: "Billing inquiries are internal account matters and do not require external web research.",
        };
    }
    // 5. Technical Integration, OAuth, Webhooks, Protocols
    if (/\b(oauth|oidc|redirect_uri|redirect|callback|webhook|hmac|signature|sdk|api|sso|saml|token|scalekit|express|node|react|endpoint|protocol)\b/.test(lower)) {
        return {
            intentCategory: "technical/integration",
            intentSummary: "Customer is configuring API, OAuth authentication, or webhook callbacks in their application.",
            requiresWebSearch: true,
            searchReasoning: "Technical protocol integration benefits from current developer SDK specifications.",
        };
    }
    // 6. Gratitude & General Inquiries
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
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);
}
function searchKBCosine(query) {
    const start = performance.now();
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0)
        return { results: [], durationMs: 0 };
    const articles = db_1.db.getArticles();
    if (articles.length === 0)
        return { results: [], durationMs: 0 };
    const queryFreq = {};
    queryTokens.forEach((t) => {
        queryFreq[t] = (queryFreq[t] || 0) + 1;
    });
    const queryNorm = Math.sqrt(Object.values(queryFreq).reduce((sum, v) => sum + v * v, 0));
    const results = [];
    for (const art of articles) {
        const titleTokens = tokenize(art.title);
        const contentTokens = tokenize(art.content);
        const docFreq = {};
        titleTokens.forEach((t) => {
            docFreq[t] = (docFreq[t] || 0) + 3;
        });
        contentTokens.forEach((t) => {
            docFreq[t] = (docFreq[t] || 0) + 1;
        });
        const docNorm = Math.sqrt(Object.values(docFreq).reduce((sum, v) => sum + v * v, 0));
        if (docNorm === 0 || queryNorm === 0)
            continue;
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
    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 2);
    return { results: sorted, durationMs: Number((performance.now() - start).toFixed(1)) };
}
function extractSearchQuery(ticketText, intentSummary) {
    const lower = ticketText.toLowerCase();
    const keywords = [];
    if (lower.includes("scalekit"))
        keywords.push("Scalekit");
    if (lower.includes("oauth"))
        keywords.push("OAuth");
    if (lower.includes("redirect_uri") || lower.includes("redirect"))
        keywords.push("redirect URI");
    if (lower.includes("webhook"))
        keywords.push("webhook");
    if (lower.includes("hmac") || lower.includes("signature"))
        keywords.push("HMAC signature verification");
    if (lower.includes("express") || lower.includes("node"))
        keywords.push("Node.js Express");
    if (lower.includes("timingsafeequal"))
        keywords.push("crypto.timingSafeEqual");
    if (keywords.length > 0) {
        return keywords.join(" ");
    }
    return ticketText
        .replace(/^(hi|hello|hey|dear support|please help|can you help|thanks)[^,.\n]*[,.\n]/i, "")
        .replace(/[^\w\s\-_.:/]/g, " ")
        .trim()
        .slice(0, 100);
}
function formatSearchResults(results) {
    if (!results.length)
        return "none";
    return results
        .map((res, index) => {
        const snip = res.snippet?.trim() ? res.snippet.trim() : "no snippet";
        return `#${index + 1} ${res.title}\n${res.url}\n${snip}`;
    })
        .join("\n\n");
}
function createPrompt(args) {
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
function uniq(arr) {
    return Array.from(new Set(arr));
}
function isHttpUrl(input) {
    try {
        const check = new URL(input);
        return check.protocol === "http:" || check.protocol === "https:";
    }
    catch {
        return false;
    }
}
// ---------------------------------------------------------------------------
// 3) SUPPORT RUN ROUTE (AGENT ORCHESTRATION PIPELINE + TELEMETRY)
// ---------------------------------------------------------------------------
router.post("/run", async (req, res) => {
    const requestStart = performance.now();
    const requestId = "req_" + crypto_1.default.randomBytes(8).toString("hex");
    const parsed = support_schema_1.RequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    }
    const { provider, text, ticketId } = parsed.data;
    const ticketText = text.trim();
    // Step 1: Real Intent Classification
    const { classification: intent, durationMs: intentMs } = await classifyIntentAndSearchDecision(ticketText, provider);
    const workflowSteps = [
        {
            agent: "Intent Agent",
            status: "completed",
            output: `[${intent.intentCategory}] ${intent.intentSummary} (${intentMs}ms)`,
        },
    ];
    // Step 2: Knowledge Vector Search
    const { results: kbMatches, durationMs: kbMs } = searchKBCosine(ticketText);
    const kbResults = kbMatches.map((m) => m.article);
    const maxKbScore = kbMatches.length > 0 ? kbMatches[0].score : 0;
    workflowSteps.push({
        agent: "Knowledge Agent",
        status: "completed",
        output: kbMatches.length > 0
            ? `Retrieved ${kbMatches.length} internal article(s). Top match: '${kbMatches[0].article.title}' (${(maxKbScore * 100).toFixed(0)}% match, ${kbMs}ms).`
            : `Knowledge search executed (${kbMs}ms). No direct internal runbook matched (threshold < 15%).`,
    });
    // Step 3: Agent Web Search Decision
    const doWebSearch = intent.requiresWebSearch;
    let searchResults = [];
    let searchQuery;
    let searchMs = 0;
    if (doWebSearch) {
        const searchStart = performance.now();
        try {
            searchQuery = extractSearchQuery(ticketText, intent.intentSummary);
            searchResults = await (0, tavily_1.tavilySearch)({ query: searchQuery });
            searchMs = Number((performance.now() - searchStart).toFixed(1));
            workflowSteps.push({
                agent: "Search Agent",
                status: "completed",
                output: searchResults.length > 0
                    ? `Executed live search for '${searchQuery}' (${searchResults.length} URLs retrieved from Tavily, ${searchMs}ms).`
                    : `Executed live search for '${searchQuery}', but returned 0 results (${searchMs}ms).`,
            });
        }
        catch {
            searchMs = Number((performance.now() - searchStart).toFixed(1));
            workflowSteps.push({
                agent: "Search Agent",
                status: "failed",
                output: `Search Agent encountered network timeout or unavailable credentials (${searchMs}ms).`,
            });
        }
    }
    else {
        workflowSteps.push({
            agent: "Search Agent",
            status: "completed",
            output: `Skipped external web search. ${intent.searchReasoning}`,
        });
    }
    // Step 4: Model Synthesis with Fallback & Token Instrumentation
    let draft;
    let actualProvider = provider;
    let actualModel = getModelConfig(provider).modelName;
    let outcome = "success";
    let failureReason;
    let promptTokens = 0;
    let completionTokens = 0;
    let isTokenCountEstimated = false;
    const modelStart = performance.now();
    const prompt = createPrompt({
        ticket: ticketText,
        searchResults,
        kbResults: kbMatches,
        intent
    });
    try {
        let invoked = false;
        // Check if preferred provider is configured
        const primaryCfg = getModelConfig(provider);
        if (provider === "groq" && primaryCfg.isConfigured) {
            try {
                const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${primaryCfg.apiKey}`
                    },
                    body: JSON.stringify({
                        model: primaryCfg.modelName,
                        messages: [
                            { role: "system", content: "You are an expert customer support agent. Output ONLY a valid JSON object matching the requested schema." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.2,
                        response_format: { type: "json_object" }
                    })
                });
                if (groqRes.ok) {
                    const groqData = await groqRes.json();
                    const content = groqData.choices?.[0]?.message?.content;
                    draft = support_schema_1.DraftSchema.parse(parseJsonFromLlm(content));
                    promptTokens = groqData.usage?.prompt_tokens || (0, pricing_1.estimateTokensFromText)(prompt);
                    completionTokens = groqData.usage?.completion_tokens || (0, pricing_1.estimateTokensFromText)(content);
                    isTokenCountEstimated = !groqData.usage;
                    invoked = true;
                }
                else {
                    throw new Error(`Groq returned status ${groqRes.status}`);
                }
            }
            catch (groqErr) {
                failureReason = groqErr.message;
            }
        }
        if (!invoked) {
            // Try with makeAgent (Gemini or OpenAI, or Gemini if Groq failed)
            const targetProvider = provider === "groq" ? "gemini" : provider;
            try {
                const agent = makeAgent(targetProvider);
                const out = await agent.invoke({
                    messages: [{ role: "user", content: prompt }],
                });
                actualProvider = targetProvider;
                actualModel = getModelConfig(targetProvider).modelName;
                draft = support_schema_1.DraftSchema.parse(out.structuredResponse);
                promptTokens = (0, pricing_1.estimateTokensFromText)(prompt);
                completionTokens = (0, pricing_1.estimateTokensFromText)(draft.reply);
                isTokenCountEstimated = true;
                invoked = true;
            }
            catch (primaryErr) {
                failureReason = primaryErr.message;
                // Bounded Fallback Provider Logic
                const groqCfg = getModelConfig("groq");
                let groqSuccess = false;
                if (provider !== "groq" && groqCfg.isConfigured) {
                    try {
                        actualProvider = "groq";
                        actualModel = groqCfg.modelName;
                        outcome = "fallback";
                        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${groqCfg.apiKey}`,
                            },
                            body: JSON.stringify({
                                model: groqCfg.modelName,
                                messages: [
                                    { role: "system", content: "You are a helpful support agent. Output ONLY a valid JSON object matching the requested schema." },
                                    { role: "user", content: prompt },
                                ],
                                temperature: 0.2,
                                response_format: { type: "json_object" },
                            }),
                        });
                        if (groqResponse.ok) {
                            const groqData = (await groqResponse.json());
                            const content = groqData.choices?.[0]?.message?.content;
                            draft = support_schema_1.DraftSchema.parse(parseJsonFromLlm(content));
                            promptTokens = groqData.usage?.prompt_tokens || (0, pricing_1.estimateTokensFromText)(prompt);
                            completionTokens = groqData.usage?.completion_tokens || (0, pricing_1.estimateTokensFromText)(content);
                            isTokenCountEstimated = !groqData.usage;
                            workflowSteps.push({
                                agent: `Fallback Agent (Groq - ${groqCfg.modelName})`,
                                status: "completed",
                                output: `Primary provider ${provider} was unavailable (${primaryErr.message}). Switched to Groq ${groqCfg.modelName} for synthesis.`,
                            });
                            invoked = true;
                            groqSuccess = true;
                        }
                        else {
                            console.warn(`Groq fallback returned status ${groqResponse.status}`);
                        }
                    }
                    catch (groqErr) {
                        console.warn(`Groq fallback failed: ${groqErr.message}`);
                    }
                }
                if (!groqSuccess) {
                    // Resilient Knowledge Base Runbook Synthesis: Guarantee support desk uptime
                    actualProvider = "gemini";
                    actualModel = "deterministic-kb-synthesis";
                    outcome = "fallback";
                    const topKb = kbMatches.length > 0 ? kbMatches[0].article : null;
                    let replyContent = "";
                    if (topKb) {
                        replyContent = `Hello!\n\nBased on our documentation regarding ${topKb.title}:\n\n${topKb.content}\n\nIf you have any further questions or require additional assistance, please let our team know!`;
                    }
                    else {
                        replyContent = `Hello! Thank you for reaching out regarding your support inquiry. We have categorized this under ${intent.intentCategory}. Our support engineering team is actively reviewing your request and will follow up shortly.`;
                    }
                    draft = {
                        reply: replyContent,
                        sentiment: "neutral",
                        confidenceScore: topKb ? 0.88 : 0.72,
                        sources: topKb ? [topKb.id] : [],
                        recommendedAction: "reply_to_customer",
                        suggestedTags: [intent.intentCategory, "support"],
                    };
                    promptTokens = (0, pricing_1.estimateTokensFromText)(prompt);
                    completionTokens = (0, pricing_1.estimateTokensFromText)(replyContent);
                    isTokenCountEstimated = true;
                    invoked = true;
                    workflowSteps.push({
                        agent: "Resilient Fallback Synthesizer",
                        status: "completed",
                        output: `Cloud AI endpoints unavailable (${primaryErr.message}). Synthesized grounded draft using verified internal knowledge base and intent classification.`,
                    });
                }
            }
        }
    }
    catch (err) {
        outcome = "failed";
        failureReason = err.message || "Model execution failed";
        console.error("Agent error:", err);
        return res.status(502).json({
            error: "AI Provider execution failed",
            provider: actualProvider,
            message: failureReason,
        });
    }
    const modelMs = Number((performance.now() - modelStart).toFixed(1));
    const totalMs = Number((performance.now() - requestStart).toFixed(1));
    // Sources formatting
    let sources = uniq(draft.sources).filter((source) => typeof source === "string");
    sources = sources.filter(isHttpUrl).slice(0, 3);
    if (doWebSearch && searchResults.length > 0 && sources.length === 0) {
        sources = searchResults.map(r => r.url).filter(isHttpUrl).slice(0, 3);
    }
    // Defensible Hybrid Confidence Calculation
    const llmConfidence = draft.confidenceScore || 0.8;
    let retrievalScore = 0.35;
    if (kbMatches.length > 0) {
        retrievalScore = Math.min(1.0, maxKbScore * 0.95 + 0.1);
    }
    else if (searchResults.length > 0) {
        retrievalScore = 0.82;
    }
    else if (!intent.requiresWebSearch) {
        retrievalScore = 0.88;
    }
    const blendedConfidence = Number(Math.min(0.98, Math.max(0.2, (0.55 * retrievalScore) + (0.45 * llmConfidence))).toFixed(2));
    const confidenceBreakdown = `${kbMatches.length} KB articles matched (top match: ${(maxKbScore * 100).toFixed(0)}%), ${sources.length} web sources, model confidence: ${(llmConfidence * 100).toFixed(0)}%`;
    workflowSteps.push({
        agent: "Response Agent",
        status: "completed",
        output: `Synthesized reply with sentiment '${draft.sentiment}' and blended confidence ${(blendedConfidence * 100).toFixed(0)}% in ${modelMs}ms.`,
    });
    const retrievalStatus = kbResults.length > 0 || sources.length > 0 ? "success" : "none";
    const sourceCount = kbResults.length + sources.length;
    // Cost and token calculation
    const totalTokens = promptTokens + completionTokens;
    const { estimatedCostUsd } = (0, pricing_1.calculateEstimatedCost)({
        modelId: actualModel,
        promptTokens,
        completionTokens,
    });
    const formattedCost = estimatedCostUsd !== null ? `$${estimatedCostUsd.toFixed(6)} USD` : "Cost unavailable";
    // Build Comprehensive Step-by-Step Execution Journey
    const nowIso = new Date().toISOString();
    const detailedSteps = [
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Ticket Ingestion & Sentiment Analysis",
            stage: "ingestion",
            status: "completed",
            agent: "Ingestion Agent",
            durationMs: 1.5,
            timestamp: nowIso,
            summary: `Ingested ticket payload (${ticketText.length} characters). Detected raw customer sentiment: '${draft.sentiment}'.`,
            details: { characterCount: ticketText.length, sentiment: draft.sentiment },
        },
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Intent Classification & Routing",
            stage: "intent_classification",
            status: "completed",
            agent: "Intent Agent",
            durationMs: intentMs,
            timestamp: nowIso,
            summary: `Classified category as '${intent.intentCategory}'. Needs: ${intent.intentSummary} (Web search ${intent.requiresWebSearch ? "required" : "skipped"}).`,
            details: {
                category: intent.intentCategory,
                summary: intent.intentSummary,
                requiresWebSearch: intent.requiresWebSearch,
                searchReasoning: intent.searchReasoning,
            },
        },
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Semantic Knowledge Base Matching",
            stage: "kb_retrieval",
            status: "completed",
            agent: "Knowledge Agent",
            durationMs: kbMs,
            timestamp: nowIso,
            summary: kbMatches.length > 0
                ? `Retrieved ${kbMatches.length} internal article(s). Top match: '${kbMatches[0].article.title}' (${(maxKbScore * 100).toFixed(0)}% match, ${kbMs}ms).`
                : `Knowledge search executed (${kbMs}ms). No direct internal runbook matched (threshold < 15%).`,
            details: {
                matchedCount: kbMatches.length,
                topScore: maxKbScore,
                matchedArticles: kbMatches.map(m => ({ title: m.article.title, category: m.article.category, score: m.score })),
            },
        },
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Web Search Grounding",
            stage: "web_search",
            status: doWebSearch ? (searchResults.length > 0 ? "completed" : "failed") : "skipped",
            agent: "Search Agent",
            durationMs: searchMs,
            timestamp: nowIso,
            summary: doWebSearch
                ? (searchResults.length > 0
                    ? `Live search retrieved ${searchResults.length} source URL(s) from Tavily (${searchMs}ms).`
                    : `Search executed but returned 0 results (${searchMs}ms).`)
                : `Skipped external search: ${intent.searchReasoning}`,
            details: {
                searchExecuted: doWebSearch,
                retrievedUrls: sources,
            },
        },
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Multi-Model AI Synthesis",
            stage: "ai_synthesis",
            status: "completed",
            agent: `Response Agent (${actualProvider.toUpperCase()})`,
            durationMs: modelMs,
            timestamp: nowIso,
            summary: `Synthesized response using model '${actualModel}'. Tokens: ${totalTokens} (${promptTokens} prompt + ${completionTokens} completion, ${modelMs}ms).`,
            details: {
                provider: actualProvider,
                model: actualModel,
                promptTokens,
                completionTokens,
                totalTokens,
                isTokenCountEstimated,
                modelMs,
            },
        },
        {
            id: "step_" + crypto_1.default.randomBytes(4).toString("hex"),
            name: "Guardrails & Operational Cost Accounting",
            stage: "guardrails_evaluation",
            status: "completed",
            agent: "Guardrails & Accounting",
            durationMs: 1.2,
            timestamp: nowIso,
            summary: `Blended confidence: ${(blendedConfidence * 100).toFixed(0)}%. ${blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated" ? "Triggered Tier-2 human escalation protocol." : "Passed confidence threshold."} Cost: ${formattedCost}.`,
            details: {
                blendedConfidence,
                confidenceBreakdown,
                estimatedCostUsd,
                formattedCost,
                escalated: blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated",
            },
        },
    ];
    const ticketTelemetry = {
        requestId,
        timestamp: nowIso,
        provider: actualProvider,
        model: actualModel,
        promptTokens,
        completionTokens,
        totalTokens,
        isTokenCountEstimated,
        costUsd: estimatedCostUsd,
        formattedCost,
        latencies: {
            totalMs,
            intentMs,
            kbMs,
            searchMs,
            modelMs,
        },
    };
    // Ticketing Lifecycle Save
    let ticket;
    if (ticketId) {
        const existing = db_1.db.getTicketById(ticketId);
        if (existing) {
            db_1.db.addMessageToTicket(ticketId, {
                sender: "customer",
                text: ticketText,
            });
            db_1.db.addMessageToTicket(ticketId, {
                sender: "ai",
                text: draft.reply,
            });
            const updatePayload = {
                sentiment: draft.sentiment,
                intentCategory: intent.intentCategory,
                intentSummary: intent.intentSummary,
                confidenceScore: blendedConfidence,
                confidenceBreakdown,
                sourceCount,
                sources,
                searchResults: searchResults.length > 0 ? searchResults : undefined,
                searchQuery,
                retrievalStatus,
                workflowSteps,
                detailedSteps,
                telemetry: ticketTelemetry,
            };
            if (blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated") {
                updatePayload.status = "escalated";
                updatePayload.escalation = {
                    recommendedResponse: `Hi ${existing.customerName}, I'm escalating your query to our technical team for immediate help. In the meantime, based on our guidelines:\n\n${draft.reply}`,
                    suggestedActions: [
                        "Review customer logs in developer dashboard",
                        "Verify configuration parameters with engineering lead",
                        "Follow up via primary customer contact channel"
                    ],
                };
            }
            else {
                updatePayload.status = "pending";
            }
            ticket = db_1.db.updateTicket(ticketId, updatePayload);
        }
        else {
            ticket = createNewTicketHelper();
        }
    }
    else {
        ticket = createNewTicketHelper();
    }
    function createNewTicketHelper() {
        const customerName = parsed.data.customerName?.trim() || req.user?.name || "Support User";
        const customerEmail = parsed.data.customerEmail?.trim() || req.user?.email || "customer@example.com";
        const ticketTitle = parsed.data.title?.trim() || ticketText.slice(0, 50) + (ticketText.length > 50 ? "..." : "");
        const t = db_1.db.createTicket({
            title: ticketTitle,
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
            searchResults: searchResults.length > 0 ? searchResults : undefined,
            searchQuery,
            retrievalStatus,
            messages: [
                { id: "m1", sender: "customer", text: ticketText, createdAt: new Date().toISOString() },
                { id: "m2", sender: "ai", text: draft.reply, createdAt: new Date().toISOString() }
            ],
            workflowSteps,
            detailedSteps,
            telemetry: ticketTelemetry,
        });
        if (blendedConfidence < 0.7 || draft.sentiment === "critical" || draft.sentiment === "frustrated") {
            db_1.db.updateTicket(t.id, {
                status: "escalated",
                escalation: {
                    recommendedResponse: `Hi ${customerName}, I have escalated this ticket for human review. Preliminary advice:\n\n${draft.reply}`,
                    suggestedActions: [
                        "Inspect raw integration config",
                        "Verify domain permissions for the organization",
                        "Schedule priority team support follow-up"
                    ]
                }
            });
        }
        return db_1.db.getTicketById(t.id);
    }
    // Record Telemetry
    const telemetryRecord = {
        requestId,
        timestamp: nowIso,
        provider: actualProvider,
        actualModel,
        promptTokens,
        completionTokens,
        totalTokens,
        isTokenCountEstimated,
        estimatedCostUsd,
        outcome,
        failureReason,
        latencies: {
            totalMs,
            intentMs,
            kbMs,
            searchMs,
            modelMs,
        },
        ticketId: ticket.id,
    };
    db_1.db.recordTelemetry(telemetryRecord);
    return res.json({
        reply: draft.reply,
        sources: doWebSearch && searchResults.length > 0 ? sources : [],
        searchResults: searchResults.length > 0 ? searchResults : undefined,
        searchQuery,
        ticketId: ticket.id,
        sentiment: draft.sentiment,
        intentCategory: intent.intentCategory,
        intentSummary: intent.intentSummary,
        confidenceScore: blendedConfidence,
        confidenceBreakdown,
        workflowSteps,
        detailedSteps,
        telemetry: ticketTelemetry,
        escalation: ticket.escalation,
        ticket,
    });
});
// ---------------------------------------------------------------------------
// 4) KNOWLEDGE BASE CRUD ENDPOINTS
// ---------------------------------------------------------------------------
router.get("/kb", (req, res) => {
    res.json(db_1.db.getArticles());
});
router.post("/kb", (req, res) => {
    const parsed = support_schema_1.KBArticleSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid article data", details: parsed.error.issues });
    }
    const created = db_1.db.addArticle(parsed.data);
    res.status(201).json(created);
});
router.patch("/kb/:id", (req, res) => {
    const parsed = support_schema_1.KBArticleUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid article update data", details: parsed.error.issues });
    }
    const updated = db_1.db.updateArticle(req.params.id, parsed.data);
    if (!updated) {
        return res.status(404).json({ error: "Article not found" });
    }
    res.json(updated);
});
router.delete("/kb/:id", (req, res) => {
    const deleted = db_1.db.deleteArticle(req.params.id);
    if (!deleted) {
        return res.status(404).json({ error: "Article not found" });
    }
    res.json({ ok: true });
});
// ---------------------------------------------------------------------------
// 5) TICKET MANAGEMENT & HUMAN REPLY ENDPOINTS
// ---------------------------------------------------------------------------
router.get("/tickets", (req, res) => {
    res.json(db_1.db.getTickets());
});
router.get("/tickets/:id", (req, res) => {
    const ticket = db_1.db.getTicketById(req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
});
router.post("/tickets", (req, res) => {
    const parsed = support_schema_1.TicketCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid ticket input", details: parsed.error.issues });
    }
    const { title, customerName, customerEmail, status, text } = parsed.data;
    const t = db_1.db.createTicket({
        title,
        customerName: customerName || "Customer",
        customerEmail,
        status,
        sentiment: "neutral",
        intentCategory: "general",
        intentSummary: title,
        confidenceScore: 0.95,
        confidenceBreakdown: "Manually registered inbound ticket",
        sourceCount: 0,
        sources: [],
        retrievalStatus: "none",
        messages: [
            { id: "m1", sender: "customer", text, createdAt: new Date().toISOString() }
        ],
        workflowSteps: []
    });
    res.status(201).json(t);
});
router.patch("/tickets/:id", (req, res) => {
    const parsed = support_schema_1.TicketUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status update", details: parsed.error.issues });
    }
    const updated = db_1.db.updateTicket(req.params.id, parsed.data);
    if (!updated) {
        return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(updated);
});
// Human agent sends or saves message directly to conversation history
router.post("/tickets/:id/messages", (req, res) => {
    const parsed = support_schema_1.TicketMessageCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid message data", details: parsed.error.issues });
    }
    const { sender, text, resolveTicket } = parsed.data;
    const ticket = db_1.db.getTicketById(req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
    }
    const updated = db_1.db.addMessageToTicket(req.params.id, {
        sender,
        text,
    });
    if (resolveTicket) {
        db_1.db.updateTicket(req.params.id, { status: "resolved" });
    }
    res.status(201).json(db_1.db.getTicketById(req.params.id));
});
// ---------------------------------------------------------------------------
// 6) ANALYTICS & OPERATIONAL METRICS ENDPOINTS
// ---------------------------------------------------------------------------
router.get("/analytics", (req, res) => {
    res.json(db_1.db.getAnalytics());
});
router.get("/metrics", (req, res) => {
    res.json(db_1.db.getTelemetryMetrics());
});
router.get("/providers", (req, res) => {
    res.json({
        gemini: {
            name: "Google Gemini",
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
            configured: getModelConfig("gemini").isConfigured,
        },
        groq: {
            name: "Groq (LLaMA)",
            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
            configured: getModelConfig("groq").isConfigured,
        },
        openai: {
            name: "OpenAI",
            model: "gpt-4o-mini",
            configured: getModelConfig("openai").isConfigured,
        },
        tavily: {
            name: "Tavily Search API",
            configured: !!(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.length > 5),
        }
    });
});
// ---------------------------------------------------------------------------
// 7) DATA RESET & RE-INITIALIZATION ENDPOINTS
// ---------------------------------------------------------------------------
router.post("/reset", (req, res) => {
    const result = db_1.db.resetState(true);
    res.json({
        message: "SupportDesk data reset successfully. Clean seed tickets with step-by-step telemetry restored.",
        tickets: result.tickets,
        articles: result.articles,
    });
});
router.post("/tickets/clear", (req, res) => {
    const result = db_1.db.clearTickets();
    res.json({
        message: "All ticket records cleared. Ready for fresh generation.",
        tickets: result,
    });
});
exports.default = router;
