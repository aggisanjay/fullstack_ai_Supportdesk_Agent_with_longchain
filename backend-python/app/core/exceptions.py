"""
Centralized exception types and FastAPI exception handlers.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500, detail: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource", detail: Any = None) -> None:
        super().__init__(f"{resource} not found", status_code=404, detail=detail)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthenticated", detail: Any = None) -> None:
        super().__init__(message, status_code=401, detail=detail)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden", detail: Any = None) -> None:
        super().__init__(message, status_code=403, detail=detail)


class ProviderError(AppError):
    def __init__(self, provider: str, message: str, detail: Any = None) -> None:
        super().__init__(
            "AI Provider execution failed",
            status_code=502,
            detail={"provider": provider, "message": message, **(detail or {})},
        )


class ValidationError(AppError):
    def __init__(self, message: str = "Invalid input", detail: Any = None) -> None:
        super().__init__(message, status_code=400, detail=detail)


class ErrorResponse(BaseModel):
    error: str
    detail: Any = None


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error("AppError %d: %s", exc.status_code, exc.message, exc_info=exc)
        else:
            logger.warning("AppError %d: %s", exc.status_code, exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(error=exc.message, detail=exc.detail).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
        issues = [{"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(error="Invalid input", detail=issues).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="Internal server error").model_dump(),
        )
