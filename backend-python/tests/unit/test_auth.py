from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_me_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_e2e_login_sets_cookie(client: AsyncClient) -> None:
    resp = await client.post(
        "/auth/e2e/login",
        json={"email": "test@example.com", "name": "Test User", "id": "usr_test1"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["id"] == "usr_test1"
    assert "session" in resp.cookies or any("session=" in h for h in resp.headers.get_list("set-cookie"))


@pytest.mark.asyncio
async def test_authenticated_me_returns_user(auth_client: AsyncClient) -> None:
    resp = await auth_client.get("/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "qa@test.local"
    assert data["user"]["id"] == "usr_qa_test"


@pytest.mark.asyncio
async def test_logout_clears_cookie(auth_client: AsyncClient) -> None:
    resp = await auth_client.post("/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

