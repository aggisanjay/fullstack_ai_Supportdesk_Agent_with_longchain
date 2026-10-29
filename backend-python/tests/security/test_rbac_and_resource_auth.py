from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_customer_cannot_view_other_customer_ticket(
    customer_client: AsyncClient,
    other_customer_client: AsyncClient,
    auth_client: AsyncClient,
) -> None:
    # 1. Customer Alice creates a ticket
    create_resp = await customer_client.post(
        "/api/support/tickets",
        json={
            "title": "Alice's Private Inbound Issue",
            "customerEmail": "customer_alice@example.com",
            "customerName": "Alice Customer",
            "text": "Help with account permissions for Alice.",
            "status": "open",
        },
    )
    assert create_resp.status_code == 201
    ticket_id = create_resp.json()["id"]

    # 2. Alice can view her own ticket
    alice_view = await customer_client.get(f"/api/support/tickets/{ticket_id}")
    assert alice_view.status_code == 200
    assert alice_view.json()["id"] == ticket_id

    # 3. Bob (different customer) is FORBIDDEN from viewing Alice's ticket
    bob_view = await other_customer_client.get(f"/api/support/tickets/{ticket_id}")
    assert bob_view.status_code == 403

    # 4. Support agent CAN view Alice's ticket
    agent_view = await auth_client.get(f"/api/support/tickets/{ticket_id}")
    assert agent_view.status_code == 200
    assert agent_view.json()["id"] == ticket_id


@pytest.mark.asyncio
async def test_customer_ticket_listing_scoped_to_own_email(
    customer_client: AsyncClient,
    other_customer_client: AsyncClient,
    auth_client: AsyncClient,
) -> None:
    # Create tickets for Alice
    await customer_client.post(
        "/api/support/tickets",
        json={
            "title": "Alice Ticket A",
            "customerEmail": "customer_alice@example.com",
            "text": "Alice question",
            "status": "open",
        },
    )
    # Create ticket for Bob
    await other_customer_client.post(
        "/api/support/tickets",
        json={
            "title": "Bob Ticket B",
            "customerEmail": "customer_bob@example.com",
            "text": "Bob question",
            "status": "open",
        },
    )

    # Alice lists tickets — should only see tickets where customerEmail == Alice
    alice_list = await customer_client.get("/api/support/tickets")
    assert alice_list.status_code == 200
    alice_tickets = alice_list.json()
    assert len(alice_tickets) > 0
    assert all(t["customerEmail"] == "customer_alice@example.com" for t in alice_tickets)

    # Bob lists tickets — should only see Bob tickets
    bob_list = await other_customer_client.get("/api/support/tickets")
    assert bob_list.status_code == 200
    bob_tickets = bob_list.json()
    assert len(bob_tickets) > 0
    assert all(t["customerEmail"] == "customer_bob@example.com" for t in bob_tickets)


@pytest.mark.asyncio
async def test_customer_cannot_update_ticket_status(
    customer_client: AsyncClient,
    auth_client: AsyncClient,
) -> None:
    # Alice creates a ticket
    res = await customer_client.post(
        "/api/support/tickets",
        json={
            "title": "Status Test",
            "customerEmail": "customer_alice@example.com",
            "text": "Status test text",
            "status": "open",
        },
    )
    assert res.status_code == 201
    ticket_id = res.json()["id"]

    # Customer Alice attempts to mark it resolved via status PATCH
    patch_resp = await customer_client.patch(
        f"/api/support/tickets/{ticket_id}",
        json={"status": "resolved"},
    )
    assert patch_resp.status_code == 403

    # Support agent can successfully update status
    agent_patch = await auth_client.patch(
        f"/api/support/tickets/{ticket_id}",
        json={"status": "resolved"},
    )
    assert agent_patch.status_code == 200
    assert agent_patch.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_customer_cannot_manage_knowledge_base(
    customer_client: AsyncClient,
    auth_client: AsyncClient,
) -> None:
    # Customer attempts to create KB article -> 403 Forbidden
    create_resp = await customer_client.post(
        "/api/support/kb",
        json={
            "title": "Malicious Customer Article",
            "category": "hacked",
            "content": "Injected unauthorized documentation.",
        },
    )
    assert create_resp.status_code == 403

    # Support agent CAN create KB article
    agent_create = await auth_client.post(
        "/api/support/kb",
        json={
            "title": "Official Agent Guide",
            "category": "documentation",
            "content": "Legitimate support documentation.",
        },
    )
    assert agent_create.status_code == 201
    article_id = agent_create.json()["id"]

    # Customer cannot update or delete the article
    update_resp = await customer_client.patch(
        f"/api/support/kb/{article_id}",
        json={"title": "Defaced Title"},
    )
    assert update_resp.status_code == 403

    delete_resp = await customer_client.delete(f"/api/support/kb/{article_id}")
    assert delete_resp.status_code == 403


@pytest.mark.asyncio
async def test_only_admin_can_clear_all_tickets(
    customer_client: AsyncClient,
    auth_client: AsyncClient,
    admin_client: AsyncClient,
) -> None:
    # Customer cannot clear tickets
    cust_resp = await customer_client.post("/api/support/tickets/clear")
    assert cust_resp.status_code == 403

    # Agent cannot clear tickets
    agent_resp = await auth_client.post("/api/support/tickets/clear")
    assert agent_resp.status_code == 403

    # Admin CAN clear tickets
    admin_resp = await admin_client.post("/api/support/tickets/clear")
    assert admin_resp.status_code == 200
    assert admin_resp.json()["tickets"] == []

