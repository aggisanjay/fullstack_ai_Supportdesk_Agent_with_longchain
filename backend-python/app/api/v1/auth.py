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
from app.core.exceptions import AppError, ForbiddenError, UnauthorizedError
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
    role: str = Field(default="agent")


class UserResponse(BaseModel):
    user: dict[str, Any]


class OkResponse(BaseModel):
    ok: bool = True


def require_auth(request: Request, settings: Settings = Depends(get_settings)) -> SessionUser:
    user = read_session_cookie(request, settings)
    if user is None:
        raise UnauthorizedError()
    return user


def require_agent_or_admin(user: SessionUser = Depends(require_auth)) -> SessionUser:
    if user.role not in ("agent", "admin"):
        raise ForbiddenError("Access forbidden: Support agent or administrator role required")
    return user


def require_admin(user: SessionUser = Depends(require_auth)) -> SessionUser:
    if user.role != "admin":
        raise ForbiddenError("Access forbidden: Administrator role required")
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

    raise AppError("Scalekit OAuth is not configured on this server", status_code=503)


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
        raise UnauthorizedError(f"OAuth error from provider: {error}")

    # 1. State validation: state parameter MUST match the stored state in cookie
    stored_state = request.cookies.get("sp_oauth_state")
    if not stored_state or not state or stored_state != state:
        logger.warning(
            "OAuth state mismatch or missing: incoming state=%s, stored_state=%s",
            state,
            stored_state,
        )
        raise UnauthorizedError("OAuth state validation failed: missing or mismatched state parameter")

    # 2. Authorization code validation
    if not code:
        raise UnauthorizedError("Missing OAuth authorization code")

    # 3. Scalekit authentication verification
    if not (ScalekitClient and settings.scalekit_client_id and settings.scalekit_client_secret):
        logger.error("Scalekit credentials are not configured on this server")
        raise UnauthorizedError("Authentication provider is not configured")

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
        if not u_dict:
            raise UnauthorizedError("No user profile returned from OAuth verification")

        if isinstance(u_dict, dict):
            u_id = str(u_dict.get("id") or u_dict.get("sub") or "")
            u_email = str(u_dict.get("email") or "")
            u_name = str(u_dict.get("name") or u_dict.get("username") or u_email.split("@")[0])
            u_role = str(u_dict.get("role") or "")
        else:
            u_id = str(getattr(u_dict, "id", "") or getattr(u_dict, "sub", ""))
            u_email = str(getattr(u_dict, "email", ""))
            u_name = str(getattr(u_dict, "name", "") or getattr(u_dict, "username", "") or u_email.split("@")[0])
            u_role = str(getattr(u_dict, "role", ""))

        if not u_id or not u_email:
            raise UnauthorizedError("OAuth provider returned incomplete user credentials")

        # Role determination
        if not u_role:
            if "admin" in u_email.lower():
                u_role = "admin"
            elif any(k in u_email.lower() for k in ["agent", "support", "lead"]):
                u_role = "agent"
            else:
                u_role = "customer"

        user_info = SessionUser(id=u_id, email=u_email, name=u_name, role=u_role)
        logger.info("Authenticated Scalekit user: %s <%s> (role=%s, id=%s)", u_name, u_email, u_role, u_id)
    except UnauthorizedError:
        raise
    except Exception as e:
        logger.error("Scalekit authenticate_with_code error: %s", e)
        raise UnauthorizedError(f"OAuth code verification failed: {e}")

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
    return UserResponse(user={"id": user.id, "email": user.email, "name": user.name, "role": user.role})


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
    user = SessionUser(id=user_id, email=email, name=name, role=body.role)
    token = set_session_cookie(response, user, settings, request=request)

    logger.info("E2E login issued for %s (%s, role=%s)", email, user_id, user.role)
    return {"ok": True, "token": token, "user": {"id": user_id, "email": email, "name": name, "role": user.role}}


@router.post("/e2e/logout")
async def e2e_logout(
    response: Response,
    settings: Settings = Depends(get_settings),
) -> OkResponse:
    if settings.is_production or not settings.e2e_test_mode:
        raise UnauthorizedError("Not found")

    clear_session_cookie(response, settings)
    return OkResponse()
