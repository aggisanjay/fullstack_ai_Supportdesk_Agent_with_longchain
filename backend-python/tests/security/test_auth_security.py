from __future__ import annotations

import pytest
from httpx import AsyncClient
from app.core.security import SessionUser, set_session_cookie
from app.core.config import get_settings


@pytest.mark.asyncio
async def test_invalid_session_cookie_returns_401(client: AsyncClient) -> None:
    client.cookies.set("session", "invalid.jwt.token")
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_expired_session_cookie_returns_401(client: AsyncClient) -> None:
    from jose import jwt
    from datetime import datetime, timedelta, timezone

    settings = get_settings()
    expired_payload = {
        "id": "usr_expired",
        "email": "expired@test.local",
        "exp": datetime.now(timezone.utc) - timedelta(days=1),
    }
    expired_token = jwt.encode(expired_payload, settings.session_jwt_secret, algorithm="HS256")
    client.cookies.set("session", expired_token)

    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_wrong_signature_secret_returns_401(client: AsyncClient) -> None:
    from jose import jwt

    tampered_payload = {"id": "usr_hacker", "email": "hacker@test.local"}
    tampered_token = jwt.encode(tampered_payload, "wrong_secret_key_32bytes_min_len!", algorithm="HS256")
    client.cookies.set("session", tampered_token)

    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_e2e_login_disabled_in_production(client: AsyncClient) -> None:
    settings = get_settings()
    original_env = settings.node_env
    try:
        settings.node_env = "production"
        resp = await client.post("/auth/e2e/login", json={"email": "attacker@test.local"})
        assert resp.status_code == 401
    finally:
        settings.node_env = original_env

