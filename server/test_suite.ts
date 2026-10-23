import http from "http";
import dotenv from "dotenv";
dotenv.config();

// We will launch or test against http://localhost:5000 or programmatic Express app
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./src/auth/auth.routes";
import authE2ERouter from "./src/auth/e2e.routes";
import supportRouter from "./src/support/support.routes";
import { requireAuth } from "./src/auth/auth.middleware";

async function runTestSuite() {
  console.log("===============================================================================");
  console.log("   SUPPORTDESK AI — INTEGRATION & BACKEND API TEST SUITE");
  console.log("===============================================================================");

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/status", (req, res) => {
    res.json({ ok: true, status: "UP" });
  });

  app.use("/auth", authRouter);
  app.use("/auth", authE2ERouter);
  app.use("/api", requireAuth);
  app.use("/api/support", supportRouter);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 5001;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server running at ${baseUrl}`);

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      testsFailed++;
    }
  }

  let sessionCookie = "";
  let createdArticleId = "";

  try {
    // 1. GET /status
    const resStatus = await fetch(`${baseUrl}/status`);
    const statusData = (await resStatus.json()) as any;
    assert(resStatus.status === 200 && statusData.ok === true && statusData.status === "UP", "GET /status returns 200 with status UP");

    // 2. Unauthenticated GET /auth/me returns 401
    const resMeUnauth = await fetch(`${baseUrl}/auth/me`);
    assert(resMeUnauth.status === 401, "Unauthenticated GET /auth/me returns 401 Unauthorized");

    // 3. POST /auth/e2e/login sets session cookie and returns 200
    const resLogin = await fetch(`${baseUrl}/auth/e2e/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "qa_tester@supportdesk.local", name: "QA Tester", id: "usr_qa1" })
    });
    const loginData = (await resLogin.json()) as any;
    const rawSetCookie = resLogin.headers.get("set-cookie");
    sessionCookie = rawSetCookie ? rawSetCookie.split(";")[0] : "";
    assert(resLogin.status === 200 && loginData.ok === true && sessionCookie.length > 0, "POST /auth/e2e/login sets session cookie and returns 200");

    // 4. Authenticated GET /auth/me returns user info
    const resMeAuth = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    const meData = (await resMeAuth.json()) as any;
    assert(resMeAuth.status === 200 && meData.user?.email === "qa_tester@supportdesk.local", "Authenticated GET /auth/me returns verified user info");

    // 5. Unauthenticated access to protected route returns 401
    const resTicketsUnauth = await fetch(`${baseUrl}/api/support/tickets`);
    assert(resTicketsUnauth.status === 401, "Unauthenticated access to /api/support/tickets returns 401");

    // 6. Authenticated GET /api/support/tickets returns array
    const resTicketsAuth = await fetch(`${baseUrl}/api/support/tickets`, {
      headers: { Cookie: sessionCookie }
    });
    const ticketsData = (await resTicketsAuth.json()) as any;
    assert(resTicketsAuth.status === 200 && Array.isArray(ticketsData), "Authenticated GET /api/support/tickets returns array of tickets");

    // 7. Authenticated GET /api/support/kb returns articles array
    const resKb = await fetch(`${baseUrl}/api/support/kb`, {
      headers: { Cookie: sessionCookie }
    });
    const kbData = (await resKb.json()) as any;
    assert(resKb.status === 200 && Array.isArray(kbData) && kbData.length > 0, "Authenticated GET /api/support/kb returns initial articles");

    // 8. Authenticated POST /api/support/kb creates new article
    const resCreateKb = await fetch(`${baseUrl}/api/support/kb`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        title: "Integration Test Document for Scalekit",
        category: "documentation",
        content: "Detailed testing content for validating knowledge base article creation."
      })
    });
    const createdKb = (await resCreateKb.json()) as any;
    createdArticleId = createdKb.id;
    assert(resCreateKb.status === 201 && createdKb.title === "Integration Test Document for Scalekit", "POST /api/support/kb creates article successfully");

    // 9. Authenticated PATCH /api/support/kb/:id updates article
    const resPatchKb = await fetch(`${baseUrl}/api/support/kb/${createdArticleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        title: "Updated Scalekit Integration Runbook"
      })
    });
    const updatedKb = (await resPatchKb.json()) as any;
    assert(resPatchKb.status === 200 && updatedKb.title === "Updated Scalekit Integration Runbook", "PATCH /api/support/kb/:id updates article with server validation");

    // 10. Authenticated DELETE /api/support/kb/:id deletes article
    const resDelKb = await fetch(`${baseUrl}/api/support/kb/${createdArticleId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie }
    });
    const delData = (await resDelKb.json()) as any;
    assert(resDelKb.status === 200 && delData.ok === true, "DELETE /api/support/kb/:id deletes article successfully");

    // 11. Authenticated POST /api/support/tickets creates a ticket
    const resCreateTicket = await fetch(`${baseUrl}/api/support/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        title: "Test Inbound Webhook Bug Ticket",
        customerName: "Acme Corp Lead",
        customerEmail: "lead@acme.com",
        status: "open",
        text: "We are getting HMAC validation error on webhook endpoint."
      })
    });
    const createdTicket = (await resCreateTicket.json()) as any;
    assert(resCreateTicket.status === 201 && createdTicket.id.startsWith("t_"), "POST /api/support/tickets creates new inbound ticket");

    // 12. Authenticated POST /api/support/tickets/:id/messages adds human reply
    const resAddMsg = await fetch(`${baseUrl}/api/support/tickets/${createdTicket.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({
        sender: "agent",
        text: "Hello! We have reviewed your webhook setup and recommend using bodyParser.raw().",
        resolveTicket: true
      })
    });
    const updatedTicket = (await resAddMsg.json()) as any;
    const lastMsg = updatedTicket.messages[updatedTicket.messages.length - 1];
    assert(resAddMsg.status === 201 && lastMsg.sender === "agent" && updatedTicket.status === "resolved", "POST /api/support/tickets/:id/messages adds human agent reply without re-triggering AI loop");

    // 13. Authenticated GET /api/support/metrics returns telemetry diagnostics
    const resMetrics = await fetch(`${baseUrl}/api/support/metrics`, {
      headers: { Cookie: sessionCookie }
    });
    const metricsData = (await resMetrics.json()) as any;
    assert(resMetrics.status === 200 && typeof metricsData.totalCostUsd === "number", "GET /api/support/metrics returns operational cost & telemetry metrics");

    // 14. Authenticated GET /api/support/providers returns provider configuration status
    const resProviders = await fetch(`${baseUrl}/api/support/providers`, {
      headers: { Cookie: sessionCookie }
    });
    const providersData = (await resProviders.json()) as any;
    assert(resProviders.status === 200 && providersData.gemini && providersData.groq && providersData.openai, "GET /api/support/providers returns safe status of configured AI engines");

  } catch (err) {
    console.error("Test execution failed with exception:", err);
    testsFailed++;
  } finally {
    server.close();
  }

  console.log("\n===============================================================================");
  console.log(`   INTEGRATION SUITE COMPLETED: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("===============================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite();
