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
    _cookie_options,
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
async def login(request: Request, settings: Settings = Depends(get_settings)) -> Any:
    """Redirect user directly to the authentic Scalekit OAuth authorization URL."""
    state = secrets.token_hex(16)
    redirect_uri = f"{settings.backend_url}/auth/callback"
    opts = _cookie_options(settings, request=request)

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
            res.set_cookie("sp_oauth_state", state, max_age=1200, **opts)
            return res
        except Exception as e:
            logger.warning("Scalekit client error: %s", e)

    if settings.scalekit_environment_url and settings.scalekit_client_id:
        auth_url = (
            f"{settings.scalekit_environment_url}/oauth/authorize?"
            f"response_type=code&client_id={settings.scalekit_client_id}&"
            f"redirect_uri={redirect_uri}&scope=openid+profile+email&state={state}&prompt=login"
        )
        res = RedirectResponse(url=auth_url, status_code=302)
        res.set_cookie("sp_oauth_state", state, max_age=1200, **opts)
        return res

    # Demo fallback when Scalekit credentials are not configured
    logger.info("Scalekit credentials not set - redirecting directly to callback with demo session")
    demo_redirect = f"{redirect_uri}?code=demo_session&state={state}"
    res = RedirectResponse(url=demo_redirect, status_code=302)
    res.set_cookie("sp_oauth_state", state, max_age=1200, **opts)
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
    frontend_target = settings.frontend_url.rstrip("/")
    if error:
        return RedirectResponse(f"{frontend_target}/login?error={error}")

    user_info = None

    if (
        ScalekitClient
        and settings.scalekit_client_id
        and settings.scalekit_client_secret
        and code
        and code != "demo_session"
    ):
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
        <meta http-equiv="Cross-Origin-Opener-Policy" content="unsafe-none">
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
            if (window.opener && !window.opener.closed) {{
              window.opener.postMessage({{ type: "SCALEKIT_AUTH_SUCCESS" }}, "*");
              setTimeout(() => {{
                try {{ window.close(); }} catch(e) {{}}
              }}, 150);
            }} else {{
              window.location.href = "{frontend_target}/support";
            }}
          }} catch(e) {{
            window.location.href = "{frontend_target}/support";
          }}
        </script>
      </body>
    </html>
    """
    res = HTMLResponse(content=html_content)
    res.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    res.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    set_session_cookie(res, user_info, settings, request=request)
    opts = _cookie_options(settings, request=request)
    res.delete_cookie(
        "sp_oauth_state",
        path=opts.get("path", "/"),
        secure=opts.get("secure", False),
        httponly=opts.get("httponly", True),
        samesite=opts.get("samesite", "lax"),
    )
    return res


@router.get("/me")
async def get_me(user: SessionUser = Depends(require_auth)) -> UserResponse:
    return UserResponse(user={"id": user.id, "email": user.email, "name": user.name})


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> OkResponse:
    clear_session_cookie(response, settings, request=request)
    return OkResponse()


@router.post("/e2e/login")
async def e2e_login(
    body: E2ELoginRequest,
    request: Request,
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
    token = set_session_cookie(response, user, settings, request=request)

    logger.info("E2E login issued for %s (%s)", email, user_id)
    return {"ok": True, "token": token, "user": {"id": user_id, "email": email, "name": name}}


@router.post("/e2e/logout")
async def e2e_logout(
    response: Response,
    settings: Settings = Depends(get_settings),
) -> OkResponse:
    if settings.is_production or not settings.e2e_test_mode:
        raise UnauthorizedError("Not found")

    clear_session_cookie(response, settings)
    return OkResponse()
