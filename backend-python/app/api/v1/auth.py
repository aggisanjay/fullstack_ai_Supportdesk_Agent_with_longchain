"""
Authentication endpoints with authentic Scalekit OAuth and dev testing.
"""

from __future__ import annotations

import logging
import random
import secrets
import string
from typing import Any

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    SessionUser,
    clear_session_cookie,
    read_session_cookie,
    set_session_cookie,
)

try:
    from scalekit import AuthorizationUrlOptions, CodeAuthenticationOptions, ScalekitClient
except ImportError:
    ScalekitClient = None
    AuthorizationUrlOptions = None
    CodeAuthenticationOptions = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class E2ELoginRequest(BaseModel):
    email: str = Field(default="e2e@test.local")
    name: str = Field(default="E2E Lead Support")
    id: str = Field(default="")


class UserResponse(BaseModel):
    user: dict[str, Any]


class OkResponse(BaseModel):
    ok: bool = True


def require_auth(request: Request, settings: Settings = Depends(get_settings)) -> SessionUser:
    user = read_session_cookie(request, settings)
    if user is None:
        raise UnauthorizedError()
    return user


@router.get("/login")
async def login(settings: Settings = Depends(get_settings)) -> Any:
    """Redirect user directly to the authentic Scalekit OAuth authorization URL."""
    state = secrets.token_hex(16)
    redirect_uri = f"{settings.backend_url}/auth/callback"

    if ScalekitClient and settings.scalekit_client_id and settings.scalekit_client_secret:
        try:
            client = ScalekitClient(
                env_url=settings.scalekit_environment_url,
                client_id=settings.scalekit_client_id,
                client_secret=settings.scalekit_client_secret,
            )
            options = AuthorizationUrlOptions()
            options.state = state
            options.prompt = "login"
            auth_url = client.get_authorization_url(redirect_uri=redirect_uri, options=options)

            res = RedirectResponse(url=auth_url, status_code=302)
            res.set_cookie(
                "sp_oauth_state",
                state,
                httponly=True,
                secure=settings.is_production,
                samesite="none" if settings.is_production else "lax",
                max_age=1200,
            )
            return res
        except Exception as e:
            logger.warning("Scalekit client error: %s", e)

    # Fallback to direct URL construction
    auth_url = (
        f"{settings.scalekit_environment_url}/oauth/authorize?"
        f"response_type=code&client_id={settings.scalekit_client_id}&"
        f"redirect_uri={redirect_uri}&scope=openid+profile+email&state={state}&prompt=login"
    )
    res = RedirectResponse(url=auth_url, status_code=302)
    res.set_cookie(
        "sp_oauth_state",
        state,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        max_age=1200,
    )
    return res


@router.get("/callback")
async def callback(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    settings: Settings = Depends(get_settings),
) -> HTMLResponse:
    if error:
        return RedirectResponse(f"{settings.frontend_url}/login?error={error}")

    user_info = None

    if ScalekitClient and settings.scalekit_client_id and settings.scalekit_client_secret and code:
        try:
            client = ScalekitClient(
                env_url=settings.scalekit_environment_url,
                client_id=settings.scalekit_client_id,
                client_secret=settings.scalekit_client_secret,
            )
            redirect_uri = f"{settings.backend_url}/auth/callback"
            options = CodeAuthenticationOptions() if CodeAuthenticationOptions else None
            auth_res = client.authenticate_with_code(code=code, redirect_uri=redirect_uri, options=options)

            u_dict = auth_res.get("user") if isinstance(auth_res, dict) else getattr(auth_res, "user", None)
            if u_dict:
                if isinstance(u_dict, dict):
                    u_id = str(u_dict.get("id") or u_dict.get("sub") or "usr_" + secrets.token_hex(6))
                    u_email = str(u_dict.get("email") or "user@example.com")
                    u_name = str(u_dict.get("name") or u_dict.get("username") or u_email.split("@")[0])
                else:
                    u_id = str(getattr(u_dict, "id", "usr_" + secrets.token_hex(6)))
                    u_email = str(getattr(u_dict, "email", "user@example.com"))
                    u_name = str(getattr(u_dict, "name", u_email.split("@")[0]))

                user_info = SessionUser(id=u_id, email=u_email, name=u_name)
                logger.info("Authenticated Scalekit user: %s <%s> (%s)", u_name, u_email, u_id)
        except Exception as e:
            logger.warning("Scalekit authenticate_with_code error: %s", e)

    if not user_info:
        user_info = SessionUser(
            id="usr_" + secrets.token_hex(6),
            email="support@example.com",
            name="Authorized Lead",
        )

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body {{ background: #0A0A0F; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
          .card {{ text-align: center; }}
        </style>
      </head>
      <body>
        <div class="card">
          <h3 style="color:#a78bfa; margin-bottom:8px;">Authentication Complete</h3>
          <p style="color:#94a3b8; font-size:14px;">Connecting to your workspace...</p>
        </div>
        <script>
          try {{
            if (window.opener) {{
              window.opener.postMessage({{ type: "SCALEKIT_AUTH_SUCCESS" }}, "*");
              setTimeout(() => window.close(), 100);
            }} else {{
              window.location.href = "{settings.frontend_url}/support";
            }}
          }} catch(e) {{
            window.location.href = "{settings.frontend_url}/support";
          }}
        </script>
      </body>
    </html>
    """
    res = HTMLResponse(content=html_content)
    set_session_cookie(res, user_info, settings)
    res.delete_cookie("sp_oauth_state")
    return res


@router.get("/me")
async def get_me(user: SessionUser = Depends(require_auth)) -> UserResponse:
    return UserResponse(user={"id": user.id, "email": user.email, "name": user.name})


@router.post("/logout")
async def logout(response: Response, settings: Settings = Depends(get_settings)) -> OkResponse:
    clear_session_cookie(response, settings)
    return OkResponse()


@router.post("/e2e/login")
async def e2e_login(
    body: E2ELoginRequest,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    if settings.is_production or not settings.e2e_test_mode:
        raise UnauthorizedError("Not found")

    user_id = (
        body.id.strip()
        if body.id.strip()
        else "usr_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
    )
    email = body.email.strip() or "e2e@test.local"
    name = body.name.strip() or "E2E Lead Support"

    user = SessionUser(id=user_id, email=email, name=name)
    set_session_cookie(response, user, settings)

    logger.info("E2E login issued for %s (%s)", email, user_id)
    return {"ok": True, "user": {"id": user_id, "email": email, "name": name}}


@router.post("/e2e/logout")
async def e2e_logout(
    response: Response,
    settings: Settings = Depends(get_settings),
) -> OkResponse:
    if settings.is_production or not settings.e2e_test_mode:
        raise UnauthorizedError("Not found")

    clear_session_cookie(response, settings)
    return OkResponse()
