from __future__ import annotations

import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.db.base import Base
import app.db.models
from app.db.session import engine
from app.middleware.request_id import RequestIdMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure pgvector extension and database schema exist on startup
    try:
        from sqlalchemy import text
        from app.db.session import async_session_factory
        from app.services.retrieval_service import RetrievalService

        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)

        async with async_session_factory() as session:
            retrieval = RetrievalService()
            await retrieval.seed_default_articles_if_empty(session)
        logger.info("Database schema synchronized and pgvector KB articles indexed.")
    except Exception as e:
        logger.warning("Database schema auto-sync notice: %s", e)
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

