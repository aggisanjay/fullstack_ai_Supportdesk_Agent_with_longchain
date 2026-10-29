# 🧠 SupportDesk AI — Production Multi-Agent Support Desk

A production-grade full-stack **AI Support Desk Agent** that accepts customer queries, coordinates a multi-agent LangGraph workflow, grounds responses with real-time Tavily web searches and PostgreSQL pgvector semantic retrieval, and produces Tier-2/Tier-3 structured responses with automated escalation and cost accounting.

---

## ✨ Features

* **🔒 Production Authentication & Session Management**: Scalekit OAuth Single Sign-On (SSO) with secure, `httpOnly` JWT session cookies preventing XSS token theft. Includes a dev-only E2E authentication bypass for local testing.
* **🤖 Multi-Agent Orchestration (LangGraph + LangChain)**:
  * **Ingestion Agent**: Validates ticket input, parses metadata, and evaluates raw customer sentiment.
  * **Intent Agent**: Classifies ticket category (`technical/integration`, `billing`, `account`, `feature_request`) and determines whether external search is required.
  * **Knowledge Agent**: Performs native **pgvector cosine similarity** search against chunked internal knowledge articles stored in PostgreSQL.
  * **Search Agent**: Executes live **Tavily web search** queries, extracting real-time documentation URLs and grounding citations.
  * **Response Agent**: Multi-model synthesis producing structured Tier-2/Tier-3 Markdown responses with greetings, root-cause diagnostics, and actionable steps.
  * **Guardrails & Accounting**: Calculates defensible hybrid confidence scores, token usage, real-time cost estimation in USD, and executes automated Tier-2 human escalation protocols.
* **⚡ Vector Database Grounding with PostgreSQL & pgvector**: Native 1536-dimensional vector embeddings with Google Gemini (`gemini-embedding-001`) and OpenAI (`text-embedding-3-small`), indexing chunked articles directly in PostgreSQL (Neon).
* **🔌 Multi-Model Failover & Resiliency**:
  * Primary: Google Gemini (`gemini-2.5-flash`)
  * Secondary: OpenAI (`gpt-4o-mini`)
  * Fallback: Groq Cloud (`qwen/qwen3.8-27b` / `llama-3.3-70b-versatile`)
* **📊 Live Telemetry & Executive Analytics**: Interactive dashboard with real-time SLA metrics, sentiment distributions, token cost tracking, and model latency breakdowns.
* **⚠️ Defensible Hybrid Escalation**: Escalates tickets to technical human leads only when blended confidence falls below $70\%$ or when customer sentiment is classified as `critical` or `frustrated`.

---

## 🏗️ Architecture

```mermaid
graph TD
    User([Customer / Support Agent]) <--> |HTTP / JSON| FE[React 19 Frontend]
    FE <--> |JWT Cookies / REST API| BE[FastAPI Python Backend]
    BE <--> |Authenticate User| Scalekit[Scalekit OAuth]
    BE <--> |Async SQL / pgvector| NeonDB[(PostgreSQL + pgvector Neon)]
    
    subgraph "LangGraph Agentic Pipeline"
        BE --> Ingestion[1. Ingestion Agent: Sentiment & Sanitization]
        Ingestion --> Intent[2. Intent Agent: Classification & Routing]
        Intent --> Knowledge[3. Knowledge Agent: pgvector Cosine Search]
        Knowledge --> Search{4. Search Agent}
        Search -->|Web Search Needed| Tavily[Tavily Search API]
        Search -->|Internal Only| Context[Grounding & Context Aggregator]
        Tavily --> Context
        Context --> Synthesis[5. AI Synthesis: Gemini / OpenAI / Groq]
        Synthesis --> Guardrails[6. Guardrails & Cost Accounting]
        Guardrails --> Escalation{Confidence < 0.70 OR Sentiment Critical/Frustrated?}
        Escalation -->|Yes| EscTicket[Status: Escalated + Suggested Actions]
        Escalation -->|No| OpenTicket[Status: Open / Pending]
    end
```

---

## 🧰 Tech Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Backend** | Python 3.12+, FastAPI, Uvicorn | High-performance asynchronous REST API. |
| **Agent Framework** | LangGraph, LangChain Core | Declarative state machines and agent coordination. |
| **Database & Vectors** | PostgreSQL 16, pgvector, SQLAlchemy 2.0 (asyncpg), Alembic | Relational storage and high-speed vector similarity indexing. |
| **Authentication** | Scalekit Python SDK, PyJWT, Python-Jose | Enterprise SSO and secure cookie-based session JWTs. |
| **External Grounding** | Tavily Search API | High-accuracy technical search and verified citation URLs. |
| **LLM Providers** | Google GenAI SDK, OpenAI SDK, Groq SDK | Multi-model synthesis with automated failover. |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons | Responsive UI with real-time agent execution visualizer. |
| **Analytics & UI** | Recharts, Radix UI, TanStack Query | Dynamic telemetry, SLA gauges, and interactive timelines. |

---

## 📁 Repository Layout

```text
├── backend-python/            # Production Python / FastAPI backend
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── agents/            # LangGraph multi-agent graph & prompt engineering
│   │   ├── api/v1/            # FastAPI REST routes (auth, support, health)
│   │   ├── core/              # Config, security, exceptions, logging
│   │   ├── db/                # SQLAlchemy models, pgvector Vector type, session
│   │   ├── middleware/        # Request ID tracing, CORS
│   │   ├── repositories/      # Clean database repository layer
│   │   ├── schemas/           # Pydantic v2 domain & API schemas
│   │   └── services/          # LLM, pgvector Retrieval, Search, and Pricing services
│   ├── tests/                 # Complete Pytest test suite (unit, security, integration)
│   ├── pyproject.toml         # Dependencies and project metadata
│   └── Dockerfile             # Container configuration
├── client/                    # React 19 / TypeScript single-page app
│   ├── src/
│   │   ├── components/        # Support agent execution UI, dialogs, analytics
│   │   ├── pages/             # Support desk platform and executive dashboard
│   │   └── lib/               # API clients and utility functions
│   └── package.json           # Frontend dependencies
├── docker-compose.yml         # Multi-container orchestration (Postgres pgvector + App)
├── README.md                  # Project documentation
└── TESTING.md                 # Testing instructions
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend-python/.env`)

Copy `backend-python/.env.example` to `backend-python/.env`:

```env
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Authentication Sessions
SESSION_COOKIE_NAME=session
SESSION_JWT_SECRET=your_jwt_signing_secret_here_32chars_min!
E2E_TEST_MODE=true

# Scalekit OAuth Integration
SCALEKIT_ENVIRONMENT_URL=https://your-domain.scalekit.dev
SCALEKIT_CLIENT_ID=your_scalekit_client_id
SCALEKIT_CLIENT_SECRET=your_scalekit_client_secret

# AI Model Provider Keys
OPENAI_API_KEY=sk-proj-your-openai-key
GEMINI_API_KEY=AIzaSy_your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=gsk_your_groq_key
GROQ_MODEL=qwen/qwen3.8-27b
TAVILY_API_KEY=tvly-your-tavily-search-key

# PostgreSQL with pgvector (e.g., Neon or local pgvector)
DATABASE_URL=postgresql+asyncpg://neondb_owner:password@ep-your-pooler.us-east-2.aws.neon.tech/neondb?ssl=require
DATABASE_URL_SYNC=postgresql+psycopg://neondb_owner:password@ep-your-host.us-east-2.aws.neon.tech/neondb?sslmode=require

# pgvector Embedding Settings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
CHUNK_SIZE=512
CHUNK_OVERLAP=64
RETRIEVAL_TOP_K=5
SIMILARITY_THRESHOLD=0.3
```

### Frontend Configuration (`client/.env`)

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Running Locally

### 1. Start the Python FastAPI Backend

Ensure Python 3.12+ is installed:

```bash
# Navigate to the backend directory
cd backend-python

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -e .

# Run database migrations against PostgreSQL / Neon
alembic upgrade head

# Start the server with hot-reload
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```
The FastAPI backend will start on **`http://localhost:5000`** (Swagger docs available at `http://localhost:5000/docs`).

> **Note on Migrations**: `alembic upgrade head` runs migration `0001_initial_schema.py`, which initializes all required tables (`users`, `tickets`, `ticket_messages`, `kb_articles`, `document_chunks`, `telemetry_records`) and creates the `pgvector` extension with 1536-dimensional vector columns. Production starts with a completely clean database (no fake articles or dummy data).

### 2. Start the React Frontend

Open a second terminal:

```bash
# Navigate to the frontend directory
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The client will start on **`http://localhost:5173`**.

---

## 📡 API Endpoints Reference

### Public & Auth Endpoints
* `GET /status` — Server health check (`{"ok": true, "status": "UP"}`).
* `GET /auth/login` — Redirects browser to Scalekit OAuth authorization URL.
* `GET /auth/callback` — Handles OAuth callback, issues session cookie, redirects to frontend dashboard.
* `POST /auth/e2e/login` — Dev-only testing route (active when `E2E_TEST_MODE=true`).
* `GET /auth/me` — Returns current authenticated user profile (`id`, `email`, `name`, `role`).
* `POST /auth/logout` — Invalidates session and clears cookie.

### Support & AI Agent Endpoints (Session Protected)
* `POST /api/support/run` — Executes the compiled LangGraph multi-agent pipeline:
  * Ingestion & sentiment classification
  * Intent classification & routing
  * pgvector semantic retrieval from Neon/PostgreSQL (1536-dimensional embeddings)
  * Real-time Tavily search grounding (with citation filtering)
  * Multi-model synthesis (Gemini / OpenAI / Groq)
  * Defensible hybrid confidence calculation, token cost accounting, and auto-escalation check.
* `GET /api/support/tickets` — Lists support tickets. Customers only see tickets matching their verified email; Agents and Admins see all tickets.
* `POST /api/support/tickets` — Creates a new ticket.
* `GET /api/support/tickets/{id}` — Retrieves detailed ticket dialogue history. Returns `403 Forbidden` if a customer attempts cross-user access.
* `PATCH /api/support/tickets/{id}` — Updates ticket status (`open`, `pending`, `escalated`, `closed`). Restricted to Support Agents and Admins.
* `POST /api/support/tickets/clear` — Clears all tickets and telemetry. Restricted strictly to Admins.
* `GET /api/support/kb` — Retrieves all knowledge base articles.
* `POST /api/support/kb` — Creates a new article and indexes 1536-dim vector chunks in pgvector. Restricted to Support Agents and Admins.
* `PATCH /api/support/kb/{id}` — Modifies an article and re-indexes vector embeddings without duplicate chunks. Restricted to Support Agents and Admins.
* `DELETE /api/support/kb/{id}` — Deletes an article and its vector chunks. Restricted to Support Agents and Admins.
* `GET /api/support/analytics` — Returns aggregate system telemetry, SLA distributions, sentiment analysis, and token cost breakdown. Restricted to Support Agents and Admins.

---

## 🧪 Testing

Run the automated pytest test suite in `backend-python`:

```bash
cd backend-python
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

**Test Coverage**:
* `tests/unit/` — Unit tests for authentication, configuration, and health endpoints.
* `tests/security/` — Security tests for session cookies, token expiration, secret validation, and production mode locks.
* `tests/integration/` — Full end-to-end integration tests for tickets, knowledge base pgvector retrieval, telemetry repositories, and the support workflow.

---

## 🐳 Docker Deployment

To run the entire system (PostgreSQL with pgvector, FastAPI Backend, and React Frontend) with Docker:

```bash
docker compose up --build
```
This starts:
- **Neon-compatible Postgres (pgvector)** on port `5432`
- **FastAPI Python Backend** on port `5000`
- **React Frontend** on port `5173`
