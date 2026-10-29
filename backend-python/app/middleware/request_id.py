from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging_config import new_request_id, request_id_ctx

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("X-Request-ID") or new_request_id()
        token = request_id_ctx.set(rid)

        start = time.perf_counter()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            status = getattr(response, "status_code", "?") if response is not None else "ERROR"
            logger.info(
                "%s %s -> %s (%.1f ms)",
                request.method,
                request.url.path,
                status,
                elapsed_ms,
            )
            request_id_ctx.reset(token)
            if response is not None:
                response.headers["X-Request-ID"] = rid
