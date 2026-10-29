"""
Embedding and Semantic Retrieval service using PostgreSQL pgvector.
Natively indexes DocumentChunks and retrieves KBArticles using cosine vector distance.
"""

from __future__ import annotations

import asyncio
import logging
import math
import uuid
from typing import Literal

from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.models import DocumentChunk, KBArticle

logger = logging.getLogger(__name__)


class RetrievalResult(BaseModel):
    article_id: str
    title: str
    category: str
    content: str
    score: float
    retrieval_method: Literal["semantic", "hybrid", "keyword_fallback"] = "semantic"


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def chunk_text(content: str, max_chars: int = 500, overlap: int = 50) -> list[str]:
    """Split content into overlapping textual chunks."""
    content = content.strip()
    if len(content) <= max_chars:
        return [content]

    chunks = []
    start = 0
    while start < len(content):
        end = min(len(content), start + max_chars)
        if end < len(content):
            last_period = content.rfind(". ", start, end)
            if last_period > start + (max_chars // 2):
                end = last_period + 1
        chunk = content[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += max_chars - overlap
    return chunks


class RetrievalService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    async def embed_text(self, text: str) -> list[float] | None:
        """Generate 1536-dimensional vector embedding for text using Gemini or OpenAI.
        Non-blocking: moves synchronous API client operations off the asyncio event loop.
        """
        text_clean = text.strip()
        if not text_clean:
            return None

        # 1. Try Google Gemini Embeddings (offloaded to threadpool)
        if self.settings.gemini_api_key:
            try:

                def _sync_gemini_embed() -> list[float] | None:
                    from google import genai
                    from google.genai import types

                    client = genai.Client(api_key=self.settings.gemini_api_key)
                    res = client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=text_clean,
                        config=types.EmbedContentConfig(output_dimensionality=1536),
                    )
                    if res.embeddings and len(res.embeddings) > 0:
                        return list(res.embeddings[0].values)
                    return None

                gemini_vec = await asyncio.to_thread(_sync_gemini_embed)
                if gemini_vec:
                    return gemini_vec
            except Exception as e:
                logger.warning("Gemini embedding error: %s", e)

        # 2. Try OpenAI Embeddings if key configured
        if self.settings.openai_api_key and not self.settings.openai_api_key.startswith("sk-proj-your"):
            try:
                from openai import AsyncOpenAI

                client = AsyncOpenAI(api_key=self.settings.openai_api_key)
                res = await client.embeddings.create(
                    model=self.settings.embedding_model,
                    input=text_clean,
                )
                if res.data and len(res.data) > 0:
                    return list(res.data[0].embedding)
            except Exception as e:
                logger.warning("OpenAI embedding error: %s", e)

        return None

    async def index_article(self, db: AsyncSession, article: KBArticle) -> list[DocumentChunk]:
        """Index an article by chunking its text and storing pgvector embeddings.
        Clears existing chunks first to allow safe re-indexing without duplicates.
        Raises RuntimeError if embeddings cannot be generated.
        """
        # Delete existing chunks for this article to allow safe re-indexing
        await db.execute(delete(DocumentChunk).where(DocumentChunk.article_id == article.id))

        chunks_text = chunk_text(f"{article.title}. {article.content}")
        if not chunks_text:
            return []

        created_chunks: list[DocumentChunk] = []
        failed_embeddings = 0

        for idx, chunk_content in enumerate(chunks_text):
            vec = await self.embed_text(chunk_content)
            if vec is None:
                failed_embeddings += 1

            chunk = DocumentChunk(
                id="chk_" + uuid.uuid4().hex[:12],
                article_id=article.id,
                chunk_index=idx,
                content=chunk_content,
                embedding=vec,
                chunk_metadata={
                    "title": article.title,
                    "category": article.category,
                    "has_embedding": vec is not None,
                },
            )
            db.add(chunk)
            created_chunks.append(chunk)

        await db.flush()

        if failed_embeddings > 0 and failed_embeddings == len(chunks_text):
            raise RuntimeError(
                f"Indexing failed for article '{article.title}': Embedding provider failed to generate vectors. "
                "Verify GEMINI_API_KEY or OPENAI_API_KEY configuration."
            )

        return created_chunks

    async def retrieve_relevant_articles(self, db: AsyncSession, query: str, limit: int = 3) -> list[RetrievalResult]:
        """Hybrid pgvector semantic cosine similarity + explicit keyword fallback search across KB articles.
        Returns empty list when knowledge base is empty.
        """
        # Fetch all articles for lookup; return empty list immediately if database is empty
        all_res = await db.execute(select(KBArticle))
        articles_map = {art.id: art for art in all_res.scalars().all()}
        if not articles_map:
            logger.debug("Knowledge base is empty. Returning 0 results.")
            return []

        article_scores: dict[str, float] = {}
        retrieval_methods: dict[str, Literal["semantic", "hybrid", "keyword_fallback"]] = {}

        # 1. pgvector Semantic Search
        query_vec = await self.embed_text(query)
        if query_vec is not None:
            try:
                distance_expr = DocumentChunk.embedding.cosine_distance(query_vec)
                stmt = (
                    select(DocumentChunk, KBArticle, (1.0 - distance_expr).label("similarity"))
                    .join(KBArticle, DocumentChunk.article_id == KBArticle.id)
                    .where(DocumentChunk.embedding.isnot(None))
                    .order_by(distance_expr)
                    .limit(limit * 3)
                )
                chunk_results = (await db.execute(stmt)).all()
                for chunk, art, sim in chunk_results:
                    val = max(0.0, float(sim))
                    if art.id not in article_scores or val > article_scores[art.id]:
                        article_scores[art.id] = val
                        retrieval_methods[art.id] = "semantic"
            except Exception as e:
                logger.warning("pgvector cosine distance query error: %s", e)
        else:
            logger.info("Semantic embedding vector unavailable for query; falling back to keyword matching.")

        # 2. Token Overlap Keyword Matching
        query_words = set(query.lower().split())
        for art_id, art in articles_map.items():
            text_body = f"{art.title} {art.content}".lower()
            matches = sum(1 for w in query_words if len(w) > 3 and w in text_body)
            keyword_score = min(0.99, (matches / max(1, len(query_words))) * 1.5)

            if art_id in article_scores:
                # Blend 70% vector + 30% keyword
                article_scores[art_id] = min(0.99, (0.70 * article_scores[art_id]) + (0.30 * keyword_score))
                retrieval_methods[art_id] = "hybrid"
            elif keyword_score > 0.15:
                article_scores[art_id] = keyword_score
                retrieval_methods[art_id] = "keyword_fallback"

        # 3. Filter and Rank
        scored = [
            (score, articles_map[art_id], retrieval_methods.get(art_id, "semantic"))
            for art_id, score in article_scores.items()
            if score >= 0.20
        ]
        scored.sort(key=lambda x: x[0], reverse=True)

        return [
            RetrievalResult(
                article_id=art.id,
                title=art.title,
                category=art.category,
                content=art.content,
                score=round(s, 2),
                retrieval_method=method,
            )
            for s, art, method in scored[:limit]
        ]
