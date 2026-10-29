from __future__ import annotations

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.db.base import Base
from app.db.models import DocumentChunk, KBArticle
from app.services.retrieval_service import RetrievalService


@pytest_asyncio.fixture
async def rag_db_session() -> AsyncGenerator[AsyncSession, None]:
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
async def test_empty_knowledge_base_returns_empty_results(rag_db_session: AsyncSession) -> None:
    service = RetrievalService()
    results = await service.retrieve_relevant_articles(rag_db_session, "how to reset my password?")
    assert results == []


@pytest.mark.asyncio
async def test_article_indexing_and_reindexing_prevents_duplicate_chunks(
    rag_db_session: AsyncSession,
) -> None:
    article = KBArticle(
        id="kb_test_sso",
        title="Configuring Scalekit SSO",
        category="documentation",
        content="Single Sign-On requires configuring OAuth 2.0 authorization code flow with PKCE.",
    )
    rag_db_session.add(article)
    await rag_db_session.flush()

    mock_embedding = [0.05] * 1536
    service = RetrievalService()

    with patch.object(service, "embed_text", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = mock_embedding

        # 1. Initial indexing
        chunks_1 = await service.index_article(rag_db_session, article)
        await rag_db_session.commit()

        assert len(chunks_1) > 0

        # Check chunks in DB
        res = await rag_db_session.execute(select(DocumentChunk).where(DocumentChunk.article_id == article.id))
        saved_chunks_1 = res.scalars().all()
        assert len(saved_chunks_1) == len(chunks_1)

        # 2. Re-indexing same article should replace, NOT duplicate chunks
        chunks_2 = await service.index_article(rag_db_session, article)
        await rag_db_session.commit()

        res_after = await rag_db_session.execute(select(DocumentChunk).where(DocumentChunk.article_id == article.id))
        saved_chunks_2 = res_after.scalars().all()
        assert len(saved_chunks_2) == len(chunks_2)


@pytest.mark.asyncio
async def test_indexing_failure_raised_when_embeddings_unavailable(
    rag_db_session: AsyncSession,
) -> None:
    article = KBArticle(
        id="kb_test_fail",
        title="Unembeddable Document",
        category="troubleshooting",
        content="This document cannot be embedded because API key is invalid.",
    )
    rag_db_session.add(article)
    await rag_db_session.flush()

    # Empty keys in settings
    test_settings = Settings(gemini_api_key="", openai_api_key="")
    service = RetrievalService(settings=test_settings)

    with pytest.raises(RuntimeError, match="Embedding provider failed to generate vectors"):
        await service.index_article(rag_db_session, article)


@pytest.mark.asyncio
async def test_retrieval_method_labeling(rag_db_session: AsyncSession) -> None:
    article = KBArticle(
        id="kb_oauth_doc",
        title="OAuth Callback Signature Guide",
        category="documentation",
        content="Ensure your HMAC SHA-256 signature is calculated over raw payload bytes.",
    )
    rag_db_session.add(article)
    await rag_db_session.commit()

    service = RetrievalService()

    # When embeddings are unavailable, keyword matching must be explicitly labeled
    with patch.object(service, "embed_text", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = None

        results = await service.retrieve_relevant_articles(rag_db_session, "HMAC signature verification guide")
        assert len(results) > 0
        assert results[0].retrieval_method == "keyword_fallback"


@pytest.mark.asyncio
async def test_query_with_no_matches_returns_empty_list(rag_db_session: AsyncSession) -> None:
    article = KBArticle(
        id="kb_billing_doc",
        title="Invoices and Billing Receipts",
        category="billing",
        content="Download monthly VAT invoices from your enterprise billing tab.",
    )
    rag_db_session.add(article)
    await rag_db_session.commit()

    service = RetrievalService()
    with patch.object(service, "embed_text", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = None

        # Query completely unrelated to billing
        results = await service.retrieve_relevant_articles(rag_db_session, "quantum physics entanglement")
        assert results == []
