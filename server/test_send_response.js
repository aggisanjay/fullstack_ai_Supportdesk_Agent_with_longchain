async function main() {
  const backendUrl = "http://localhost:5000";
  console.log("Authenticating...");
  const loginRes = await fetch(`${backendUrl}/auth/e2e/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", name: "Test User", id: "tester" })
  });
  const rawCookie = loginRes.headers.get("set-cookie");
  const cookie = rawCookie.split(";")[0];

  console.log("Creating a ticket first...");
  const ticketRes = await fetch(`${backendUrl}/api/support/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({
      title: "Test Webhook Signature Issue",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      status: "open",
      text: "I am having signature verification failure when using Webhooks in Node.js"
    })
  });
  const ticket = await ticketRes.json();
  console.log("Created ticket ID:", ticket.id);

  console.log("Sending agent response to /api/support/run...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${backendUrl}/api/support/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie
      },
      body: JSON.stringify({
        provider: "gemini",
        text: "[AGENT RESPONSE] You need to place express.json() after the Stripe webhook route.",
        ticketId: ticket.id
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("HUNG: The agent response request did not respond within 15 seconds.");
    } else {
      console.error("Error:", err);
    }
  }
}

main();
