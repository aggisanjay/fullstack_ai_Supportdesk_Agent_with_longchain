### 🧠 Agentic Support Desk — Full Stack AI Application

A full-stack **Support Desk Agent** that authenticates users via OAuth, accepts customer tickets, and generates structured AI replies using LLM agents with optional web-search grounding.

This project demonstrates real-world AI backend design including:

- Cookie-based authentication

- Protected APIs

- Structured LLM outputs

- LangGraph agent orchestration

- React frontend with session-aware routing



# ✨ Features

✅ OAuth login (Scalekit)  

✅ httpOnly JWT session cookies  

✅ Protected backend APIs  

✅ Agentic AI reply generation  

✅ OpenAI + Gemini provider switching  

✅ Optional web search grounding (Tavily)  

✅ Strict JSON response validation (Zod)  

✅ Dev-only E2E authentication mode  



# 🏗️ Architecture

## Frontend (React + Vite)

Responsible for:

- Login flow

- Session handling

- Protected routes

- Agent UI

- API communication

## Backend (Express + TypeScript)

Responsible for:

- OAuth authentication

- JWT cookie sessions

- Route protection middleware

- AI agent orchestration

- Web search integration

- Structured response validation

# 🔐 Authentication Flow

1. User clicks **Login**

2. Backend redirects to OAuth provider via Scalekit

3. OAuth callback creates a signed JWT session cookie

4. Frontend fetches `/auth/me` to load user session

5. `/api/*` routes require valid cookie authentication

Sessions are stored as:

httpOnly cookies

# 🤖 Agent Workflow

Endpoint:

POST /api/support/run

Flow:

1. Validate request with Zod

2. Detect if web search is required

3. Fetch Tavily search results (optional)

4. Build structured prompt

5. Run LangGraph agent

6. Enforce strict JSON output:

{
"reply": string,
"sources": string[]
}

7. Filter and validate URLs

8. Return structured response to frontend


# 🧰 Tech Stack

## Frontend

- React

- TypeScript

- React Router

- Tailwind CSS

- Zod

## Backend

- Node.js

- Express

- TypeScript

- LangChain

- LangGraph

- OpenAI

- Google Gemini

- Scalekit OAuth

- JSON Web Tokens

# ⚙️ Environment Variables

## Backend

.env

PORT=5000

NODE_ENV=development

BACKEND_URL=http://localhost:5000

FRONTEND_URL=http://localhost:5173

SESSION_COOKIE_NAME=session

SESSION_JWT_SECRET=your_secret

OPENAI_API_KEY=

GEMINI_API_KEY=

TAVILY_API_KEY=

SCALEKIT_ENVIRONMENT_URL=

SCALEKIT_CLIENT_ID=

SCALEKIT_CLIENT_SECRET=

E2E_TEST_MODE=true


## Frontend 

.env

VITE_BACKEND_URL=http://localhost:5000


# 🚀 Running Locally

## Backend


cd server

npm install

npm run dev

Frontend

cd client

npm install

npm run dev

# 🧪 Dev E2E Authentication (Testing Only)

When enabled:

E2E_TEST_MODE=true

NODE_ENV=development

You can simulate login:

POST /auth/e2e/login

Example:

{
  "id": "e2e_user_1",
  "email": "e2e@test.local",
  "name": "E2E User"
}

# 📡 API Endpoints

Public

GET /status

GET /auth/login

GET /auth/callback

Authenticated

GET /auth/me

POST /auth/logout

POST /api/support/run

# 🎯 Design Decisions

httpOnly cookies prevent XSS token theft

Zod ensures predictable AI outputs

LangGraph enables future tool-based workflows

Web search grounding reduces hallucination risk

Provider abstraction allows OpenAI or Gemini

