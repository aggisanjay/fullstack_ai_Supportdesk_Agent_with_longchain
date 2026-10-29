from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.repositories.db_repository import KBRepository, TelemetryRepository, TicketRepository


@pytest_asyncio.fixture
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_kb_repository_crud(test_db_session: AsyncSession) -> None:
    repo = KBRepository(test_db_session)

    # 1. Create
    article = await repo.create(
        id="kb_test_1",
        title="OAuth Callback Setup",
        category="documentation",
        content="Use http://localhost:5000/auth/callback for local testing.",
    )
    assert article.id == "kb_test_1"
    assert article.title == "OAuth Callback Setup"

    # 2. Read
    fetched = await repo.get_by_id("kb_test_1")
    assert fetched is not None
    assert fetched.content == "Use http://localhost:5000/auth/callback for local testing."

    # 3. Update
    updated = await repo.update("kb_test_1", title="OAuth Callback Setup Updated")
    assert updated is not None
    assert updated.title == "OAuth Callback Setup Updated"

    # 4. List
    all_articles = await repo.get_all()
    assert len(all_articles) == 1

    # 5. Delete
    deleted = await repo.delete("kb_test_1")
    assert deleted is True
    assert await repo.get_by_id("kb_test_1") is None


@pytest.mark.asyncio
async def test_ticket_repository_lifecycle(test_db_session: AsyncSession) -> None:
    repo = TicketRepository(test_db_session)

    # 1. Create ticket
    ticket = await repo.create(
        title="Scalekit redirect URI mismatch",
        customer_name="Bob Smith",
        customer_email="bob@example.com",
        status="open",
        sentiment="frustrated",
        confidence_score=0.85,
    )
    assert ticket.id.startswith("t_")
    assert ticket.customer_name == "Bob Smith"

    # 2. Add message
    msg = await repo.add_message(
        ticket_id=ticket.id, sender="customer", text="I am blocked by the OAuth callback URL error."
    )
    assert msg.id.startswith("msg_")
    assert msg.text == "I am blocked by the OAuth callback URL error."

    # 3. Add AI reply
    msg_ai = await repo.add_message(
        ticket_id=ticket.id,
        sender="ai",
        text="Please ensure your redirect URI matches http://localhost:5000/auth/callback.",
    )
    assert msg_ai.id.startswith("msg_")

    # 4. Fetch ticket with messages
    fetched = await repo.get_by_id(ticket.id)
    assert fetched is not None
    assert len(fetched.messages) == 2

    # 5. Update status
    updated = await repo.update(ticket.id, status="resolved")
    assert updated is not None
    assert updated.status == "resolved"


@pytest.mark.asyncio
async def test_telemetry_repository(test_db_session: AsyncSession) -> None:
    repo = TelemetryRepository(test_db_session)

    record = await repo.record(
        request_id="req_test_1",
        provider="gemini",
        actual_model="gemini-2.5-flash",
        prompt_tokens=400,
        completion_tokens=100,
        total_tokens=500,
        is_token_count_estimated=False,
        estimated_cost_usd=0.00005,
        outcome="success",
        latencies={"totalMs": 250.0, "intentMs": 20.0, "kbMs": 5.0, "searchMs": 0.0, "modelMs": 225.0},
    )
    assert record.id is not None
    assert record.provider == "gemini"

    recent = await repo.get_recent(limit=10)
    assert len(recent) == 1
    assert recent[0].request_id == "req_test_1"
