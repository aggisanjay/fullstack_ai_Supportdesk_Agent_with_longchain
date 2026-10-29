from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.db.models
from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.db.session import engine
from app.middleware.request_id import RequestIdMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Verify database connectivity on startup — fail fast if unreachable
    try:
        from sqlalchemy import text

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
        logger.info("Database connection verified successfully.")

        # In local development only, ensure vector extension is available
        if settings.is_development:
            try:
                async with engine.begin() as conn:
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            except Exception as e:
                logger.debug("Local pgvector extension notice: %s", e)
    except Exception as e:
        logger.error("CRITICAL: Failed to connect to database on startup: %s", e)
        raise

    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(level="DEBUG" if settings.is_development else "INFO")

    app = FastAPI(
        title="SupportDesk AI - Python Backend",
        version="0.1.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.add_middleware(RequestIdMiddleware)
    register_exception_handlers(app)
    app.include_router(api_router)

    logger.info(
        "SupportDesk AI backend initialized - env=%s port=%s cors=%s",
        settings.node_env,
        settings.port,
        settings.cors_origins,
    )

    return app


app = create_app()
