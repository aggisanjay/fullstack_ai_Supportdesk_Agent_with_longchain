"""
JWT cookie authentication — wire-compatible with the Node.js backend.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Request, Response
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import Settings, get_settings


class SessionUser(BaseModel):
    id: str
    email: str
    name: str | None = None


def _cookie_options(settings: Settings) -> dict[str, Any]:
    is_prod = settings.is_production
    return {
        "httponly": True,
        "secure": is_prod,
        "samesite": "none" if is_prod else "lax",
        "path": "/",
    }


def set_session_cookie(response: Response, user: SessionUser, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    payload = {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.session_jwt_expiry_days),
    }
    token = jwt.encode(payload, settings.session_jwt_secret, algorithm="HS256")

    opts = _cookie_options(settings)
    max_age = settings.session_jwt_expiry_days * 24 * 60 * 60
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=max_age,
        **opts,
    )


def clear_session_cookie(response: Response, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    opts = _cookie_options(settings)
    response.delete_cookie(key=settings.session_cookie_name, **opts)


import logging

logger = logging.getLogger(__name__)


def read_session_cookie(request: Request, settings: Settings | None = None) -> SessionUser | None:
    settings = settings or get_settings()
    token = request.cookies.get(settings.session_cookie_name)
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
        )
    except Exception as e:
        logger.warning("read_session_cookie decode error: %s", e)
        return None

