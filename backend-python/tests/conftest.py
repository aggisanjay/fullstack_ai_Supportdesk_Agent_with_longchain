from __future__ import annotations

import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
import app.db.models  # ensure models are registered


@pytest.fixture(autouse=True, scope="session")
def _set_test_env() -> None:
    os.environ["NODE_ENV"] = "development"
    os.environ["SESSION_JWT_SECRET"] = "test_secret_32bytes_minimum_length!"
    os.environ["SESSION_COOKIE_NAME"] = "session"
    os.environ["E2E_TEST_MODE"] = "true"
    os.environ["FRONTEND_URL"] = "http://localhost:5173"
    os.environ["BACKEND_URL"] = "http://localhost:5000"


@pytest_asyncio.fixture
async def app_with_test_db():
    from app.core.config import get_settings
    get_settings.cache_clear()

    # Use StaticPool so all connections share the same in-memory SQLite database!
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    from app.main import create_app
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db

    yield app

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(app_with_test_db) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app_with_test_db)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    login_resp = await client.post(
        "/auth/e2e/login",
        json={"email": "qa@test.local", "name": "QA Tester", "id": "usr_qa_test"},
    )
    assert login_resp.status_code == 200
    return client
