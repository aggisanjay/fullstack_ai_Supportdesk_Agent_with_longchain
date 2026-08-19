import fs from "fs";
import path from "path";

export interface KBArticle {
  id: string;
  title: string;
  category: "faq" | "documentation" | "internal" | "troubleshooting";
  content: string;
  createdAt: string;
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

export interface EscalationInfo {
  recommendedResponse: string;
  suggestedActions: string[];
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
  retrievalStatus: "success" | "none" | "failed";
  messages: TicketMessage[];
  workflowSteps: WorkflowStep[];
  escalation?: EscalationInfo;
  createdAt: string;
}

interface DBState {
  articles: KBArticle[];
  tickets: Ticket[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_ARTICLES: KBArticle[] = [
  {
    id: "kb_1",
    title: "How to retrieve a Scalekit client secret",
    category: "faq",
    content: "To retrieve your client secret in Scalekit, log in to the Scalekit Admin Dashboard, select your environment (e.g., Development or Production), navigate to 'API Settings' or 'Client Credentials', and click 'Generate Secret'. Make sure to copy it immediately, as it will only be displayed once.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_2",
    title: "OAuth Redirect URI Setup Guide",
    category: "documentation",
    content: "When setting up Single Sign-On (SSO) or OAuth, you must configure a Redirect URI. The redirect URI is where the authorization server sends the user after successful authentication. For local testing, use: http://localhost:5000/auth/callback. In production, ensure this is set to your HTTPS backend endpoint and matches exactly.",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_3",
    title: "LangGraph Agent Troubleshooting Guidelines",
    category: "internal",
    content: "If the LangGraph support agent fails with status 422 (sources are empty or not allowed), check if a web search was performed via Tavily. The agent's response format schema requires that any source URL returned must be a subset of the Tavily search results. If the user explicitly asks for docs or oauth features, the web search will trigger, so ensure TAVILY_API_KEY is active.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kb_4",
    title: "Resolving Webhook Signature Failures",
    category: "troubleshooting",
    content: "Webhook verification errors usually happen when the payload is modified or parsed before hashing. Verify that: 1. You are using the raw request body buffer to compute the HMAC-SHA256 signature. 2. The signing secret matches the secret from your developer portal. 3. The signature algorithm is SHA-256.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    confidenceBreakdown: "0 KB articles with direct match, 1 external search attempted, 40% model self-assessment",
    sourceCount: 0,
    retrievalStatus: "failed",
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
    ]
  }
];

export class SimpleDB {
  private state: DBState = { articles: [], tickets: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.state = JSON.parse(fileContent);
      } else {
        this.state = {
          articles: [...DEFAULT_ARTICLES],
          tickets: [...DEFAULT_TICKETS],
        };
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB state:", e);
      this.state = { articles: [...DEFAULT_ARTICLES], tickets: [...DEFAULT_TICKETS] };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save local DB state:", e);
    }
  }

  // Articles CRUD
  getArticles(): KBArticle[] {
    return this.state.articles;
  }

  addArticle(article: Omit<KBArticle, "id" | "createdAt">): KBArticle {
    const newArt: KBArticle = {
      ...article,
      id: "kb_" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.state.articles.push(newArt);
    this.save();
    return newArt;
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

  // Tickets CRUD
  getTickets(): Ticket[] {
    return this.state.tickets;
  }

  getTicketById(id: string): Ticket | undefined {
    return this.state.tickets.find((t) => t.id === id);
  }

  createTicket(ticket: Omit<Ticket, "id" | "createdAt">): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: "t_" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
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
    } as Ticket;
    this.save();
    return this.state.tickets[index];
  }

  addMessageToTicket(ticketId: string, message: Omit<TicketMessage, "id" | "createdAt">): Ticket | null {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return null;

    const newMsg: TicketMessage = {
      ...message,
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    ticket.messages.push(newMsg);
    
    // Update ticket title if it was empty
    if (!ticket.title && message.sender === "customer") {
      ticket.title = message.text.split("\n")[0].slice(0, 50);
    }
    
    this.save();
    return ticket;
  }

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
}

export const db = new SimpleDB();
