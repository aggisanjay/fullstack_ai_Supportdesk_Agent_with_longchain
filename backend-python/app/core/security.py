"""
JWT cookie authentication — wire-compatible with the Node.js backend.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Request, Response
from jose import jwt
from pydantic import BaseModel

from app.core.config import Settings, get_settings


class SessionUser(BaseModel):
    id: str
    email: str
    name: str | None = None
    role: str = "customer"  # "admin" | "agent" | "customer"


def _cookie_options(settings: Settings, request: Request | None = None) -> dict[str, Any]:
    is_https = (
        settings.is_production
        or settings.backend_url.lower().startswith("https://")
        or (
            request is not None
            and (request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https")
        )
    )
    return {
        "httponly": True,
        "secure": is_https,
        "samesite": "none" if is_https else "lax",
        "path": "/",
    }


def set_session_cookie(
    response: Response,
    user: SessionUser,
    settings: Settings | None = None,
    request: Request | None = None,
) -> str:
    settings = settings or get_settings()
    payload = {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "role": user.role,
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(days=settings.session_jwt_expiry_days),
    }
    token = jwt.encode(payload, settings.session_jwt_secret, algorithm="HS256")

    opts = _cookie_options(settings, request=request)
    max_age = settings.session_jwt_expiry_days * 24 * 60 * 60
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=max_age,
        **opts,
    )
    return token


def clear_session_cookie(
    response: Response,
    settings: Settings | None = None,
    request: Request | None = None,
) -> None:
    settings = settings or get_settings()
    opts = _cookie_options(settings, request=request)
    response.delete_cookie(
        key=settings.session_cookie_name,
        path=opts.get("path", "/"),
        secure=opts.get("secure", False),
        httponly=opts.get("httponly", True),
        samesite=opts.get("samesite", "lax"),
    )


import logging

logger = logging.getLogger(__name__)


def read_session_cookie(request: Request, settings: Settings | None = None) -> SessionUser | None:
    settings = settings or get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        auth_hdr = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_hdr and auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    if not token:
        logger.debug(
            "read_session_cookie: cookie '%s' missing. Incoming cookies: %s",
            settings.session_cookie_name,
            list(request.cookies.keys()),
        )
        return None

    try:
        decoded = jwt.decode(
            token,
            settings.session_jwt_secret,
            algorithms=["HS256"],
            options={"verify_exp": True, "verify_iat": False},
        )
        return SessionUser(
            id=str(decoded.get("id", "")),
            email=str(decoded.get("email", "")),
            name=decoded.get("name"),
            role=str(decoded.get("role", "customer")),
        )
    except Exception as e:
        logger.warning("read_session_cookie decode error: %s", e)
        return None
