"""
Test fixtures for knowledge base articles.
Used in tests only — never auto-seeded into production databases.
"""

DEFAULT_ARTICLES = [
    {
        "id": "kb_1",
        "title": "How to retrieve a Scalekit client secret",
        "category": "faq",
        "content": "To retrieve your client secret in Scalekit, log in to the Scalekit Admin Dashboard, select your environment (e.g., Development or Production), navigate to 'API Settings' or 'Client Credentials', and click 'Generate Secret'. Make sure to copy it immediately, as it will only be displayed once.",
    },
    {
        "id": "kb_2",
        "title": "OAuth Redirect URI Setup Guide",
        "category": "documentation",
        "content": "When setting up Single Sign-On (SSO) or OAuth, you must configure a Redirect URI. The redirect URI is where the authorization server sends the user after successful authentication. For local testing, use: http://localhost:5000/auth/callback. In production, ensure this is set to your HTTPS backend endpoint and matches exactly.",
    },
    {
        "id": "kb_3",
        "title": "LangGraph Agent Troubleshooting Guidelines",
        "category": "internal",
        "content": "If the LangGraph support agent fails with status 422 (sources are empty or not allowed), check if a web search was performed via Tavily. The agent's response format schema requires that any source URL returned must be a subset of the Tavily search results. If the user explicitly asks for docs or oauth features, the web search will trigger, so ensure TAVILY_API_KEY is active.",
    },
    {
        "id": "kb_4",
        "title": "Resolving Webhook Signature Failures",
        "category": "troubleshooting",
        "content": "Webhook verification errors usually happen when the payload is modified or parsed before hashing. Verify that: 1. You are using the raw request body buffer to compute the HMAC-SHA256 signature. 2. The signing secret matches the secret from your developer portal. 3. The signature algorithm is SHA-256.",
    },
]
