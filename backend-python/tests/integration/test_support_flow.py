from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_support_api_lifecycle(auth_client: AsyncClient) -> None:
    # 1. Check providers
    prov_resp = await auth_client.get("/api/support/providers")
    assert prov_resp.status_code == 200
    providers = prov_resp.json()
    assert "gemini" in providers
    assert "groq" in providers

    # 2. Create Knowledge Base article
    kb_create = await auth_client.post(
        "/api/support/kb",
        json={
            "title": "OAuth 2.0 Redirect Configuration",
            "category": "documentation",
            "content": "Make sure your redirect URI is set to http://localhost:5000/auth/callback in your console.",
        },
    )
    assert kb_create.status_code == 201
    article = kb_create.json()
    assert article["title"] == "OAuth 2.0 Redirect Configuration"
    article_id = article["id"]

    # 3. Read KB list
    kb_list = await auth_client.get("/api/support/kb")
    assert kb_list.status_code == 200
    assert any(a["id"] == article_id for a in kb_list.json())

    # 4. Run support agent
    agent_run = await auth_client.post(
        "/api/support/run",
        json={
            "text": "How do I configure my redirect URI for OAuth in my application?",
            "provider": "gemini",
        },
    )
    assert agent_run.status_code == 200
    res = agent_run.json()
    assert "reply" in res
    assert "confidenceScore" in res
    assert "workflowSteps" in res
    assert "telemetry" in res
    assert "ticket" in res

    ticket_id = res["ticket"]["id"]

    # 5. Get ticket details
    t_detail = await auth_client.get(f"/api/support/tickets/{ticket_id}")
    assert t_detail.status_code == 200
    assert t_detail.json()["id"] == ticket_id

    # 6. Add human message to ticket
    msg_resp = await auth_client.post(
        f"/api/support/tickets/{ticket_id}/messages",
        json={"sender": "agent", "text": "Customer issue has been reviewed and verified."},
    )
    assert msg_resp.status_code == 201

    # 7. Check analytics & metrics
    analytics_resp = await auth_client.get("/api/support/analytics")
    assert analytics_resp.status_code == 200
    assert "totalTickets" in analytics_resp.json()

    metrics_resp = await auth_client.get("/api/support/metrics")
    assert metrics_resp.status_code == 200
    assert "totalTokens" in metrics_resp.json()

    # 8. Clean up KB article
    del_resp = await auth_client.delete(f"/api/support/kb/{article_id}")
    assert del_resp.status_code == 200
