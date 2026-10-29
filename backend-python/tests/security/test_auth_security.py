from __future__ import annotations

from datetime import UTC

import pytest
from httpx import AsyncClient

from app.core.config import get_settings


@pytest.mark.asyncio
async def test_invalid_session_cookie_returns_401(client: AsyncClient) -> None:
    client.cookies.set("session", "invalid.jwt.token")
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_expired_session_cookie_returns_401(client: AsyncClient) -> None:
    from datetime import datetime, timedelta

    from jose import jwt

    settings = get_settings()
    expired_payload = {
        "id": "usr_expired",
        "email": "expired@test.local",
        "exp": datetime.now(UTC) - timedelta(days=1),
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


@pytest.mark.asyncio
async def test_oauth_callback_rejects_missing_state(client: AsyncClient) -> None:
    resp = await client.get("/auth/callback?code=some_auth_code")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_oauth_callback_rejects_mismatched_state(client: AsyncClient) -> None:
    client.cookies.set("sp_oauth_state", "expected_state_123")
    resp = await client.get("/auth/callback?code=some_auth_code&state=different_state_456")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_oauth_callback_rejects_missing_code(client: AsyncClient) -> None:
    client.cookies.set("sp_oauth_state", "valid_state_123")
    resp = await client.get("/auth/callback?state=valid_state_123")
    assert resp.status_code == 401


def test_production_rejects_insecure_default_signing_secret() -> None:
    from app.core.config import Settings

    with pytest.raises(ValueError, match="strong, non-default SESSION_JWT_SECRET"):
        Settings(
            node_env="production",
            session_jwt_secret="default_dev_secret_jwt_key_32bytes!",
        )

    with pytest.raises(ValueError, match="strong, non-default SESSION_JWT_SECRET"):
        Settings(
            node_env="production",
            session_jwt_secret="too_short_for_prod_20char",
        )
