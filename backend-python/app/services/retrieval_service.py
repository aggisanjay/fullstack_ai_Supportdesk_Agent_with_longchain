"""
Embedding and Semantic Retrieval service using PostgreSQL pgvector.
Natively indexes DocumentChunks and retrieves KBArticles using cosine vector distance.
"""

from __future__ import annotations

import logging
import math
import uuid
from typing import Any, List, Optional, Tuple
from pydantic import BaseModel
from sqlalchemy import select, func, text, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.core.config import Settings, get_settings
from app.db.models import KBArticle, DocumentChunk

logger = logging.getLogger(__name__)

DEFAULT_ARTICLES = [
    {
        "id": "kb_1",
        "title": "How to retrieve a Scalekit client secret",
        "category": "faq",
        "content": "To retrieve your client secret in Scalekit, log in to the Scalekit Admin Dashboard, select your environment (e.g., Development or Production), navigate to 'API Settings' or 'Client Credentials', and click 'Generate Secret'. Make sure to copy it immediately, as it will only be displayed once.",
    },
    {
        "id": "kb_2",
        "title": "OAuth Redirect URI Setup Guide",
        "category": "documentation",
        "content": "When setting up Single Sign-On (SSO) or OAuth, you must configure a Redirect URI. The redirect URI is where the authorization server sends the user after successful authentication. For local testing, use: http://localhost:5000/auth/callback. In production, ensure this is set to your HTTPS backend endpoint and matches exactly.",
    },
    {
        "id": "kb_3",
        "title": "LangGraph Agent Troubleshooting Guidelines",
        "category": "internal",
        "content": "If the LangGraph support agent fails with status 422 (sources are empty or not allowed), check if a web search was performed via Tavily. The agent's response format schema requires that any source URL returned must be a subset of the Tavily search results. If the user explicitly asks for docs or oauth features, the web search will trigger, so ensure TAVILY_API_KEY is active.",
    },
    {
        "id": "kb_4",
        "title": "Resolving Webhook Signature Failures",
        "category": "troubleshooting",
        "content": "Webhook verification errors usually happen when the payload is modified or parsed before hashing. Verify that: 1. You are using the raw request body buffer to compute the HMAC-SHA256 signature. 2. The signing secret matches the secret from your developer portal. 3. The signature algorithm is SHA-256.",
    },
]


class RetrievalResult(BaseModel):
    article_id: str
    title: str
    category: str
    content: str
    score: float


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def chunk_text(content: str, max_chars: int = 500, overlap: int = 50) -> List[str]:
    """Split content into overlapping textual chunks."""
    content = content.strip()
    if len(content) <= max_chars:
        return [content]
    
    chunks = []
    start = 0
    while start < len(content):
        end = min(len(content), start + max_chars)
        # Try breaking on period or newline if possible
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

    async def embed_text(self, text: str) -> Optional[List[float]]:
        """Generate 1536-dimensional vector embedding for text using Gemini or OpenAI."""
        text_clean = text.strip()
        if not text_clean:
            return None

        # 1. Try Google Gemini Embeddings
        if self.settings.gemini_api_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=self.settings.gemini_api_key)
                res = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=text_clean,
                    config=types.EmbedContentConfig(output_dimensionality=1536),
                )
                if res.embeddings and len(res.embeddings) > 0:
                    return res.embeddings[0].values
            except Exception as e:
                logger.warning(f"Gemini embedding error: {e}")

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
                    return res.data[0].embedding
            except Exception as e:
                logger.warning(f"OpenAI embedding error: {e}")

        return None

    async def index_article(self, db: AsyncSession, article: KBArticle) -> List[DocumentChunk]:
        """Index an article by chunking its text and storing pgvector embeddings."""
        # Delete existing chunks for this article
        await db.execute(delete(DocumentChunk).where(DocumentChunk.article_id == article.id))

        chunks_text = chunk_text(f"{article.title}. {article.content}")
        created_chunks: List[DocumentChunk] = []

        for idx, chunk_content in enumerate(chunks_text):
            vec = await self.embed_text(chunk_content)
            chunk = DocumentChunk(
                id="chk_" + uuid.uuid4().hex[:12],
                article_id=article.id,
                chunk_index=idx,
                content=chunk_content,
                embedding=vec,
                chunk_metadata={"title": article.title, "category": article.category},
            )
            db.add(chunk)
            created_chunks.append(chunk)

        await db.flush()
        return created_chunks

    async def seed_default_articles_if_empty(self, db: AsyncSession) -> None:
        """Seed initial knowledge base articles with pgvector chunks if table is empty."""
        count_res = await db.execute(select(func.count(KBArticle.id)))
        current_count = count_res.scalar() or 0
        if current_count > 0:
            return

        logger.info("Seeding default knowledge base articles with pgvector embeddings...")
        for art_data in DEFAULT_ARTICLES:
            article = KBArticle(
                id=art_data["id"],
                title=art_data["title"],
                category=art_data["category"],
                content=art_data["content"],
            )
            db.add(article)
            await db.flush()
            await self.index_article(db, article)

        await db.commit()
        logger.info(f"Seeded {len(DEFAULT_ARTICLES)} KB articles with pgvector embeddings.")

    async def retrieve_relevant_articles(
        self, db: AsyncSession, query: str, limit: int = 3
    ) -> List[RetrievalResult]:
        """
        Hybrid pgvector semantic cosine similarity + keyword fallback search across KB articles.
        """
        # Ensure default articles are seeded if table is empty
        await self.seed_default_articles_if_empty(db)

        # 1. Fetch all articles for keyword scoring and metadata lookup
        all_res = await db.execute(select(KBArticle))
        articles_map = {art.id: art for art in all_res.scalars().all()}
        if not articles_map:
            return []

        article_scores: dict[str, float] = {}

        # 2. pgvector Semantic Search
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
                    # pgvector cosine similarity ranges roughly between 0.0 and 1.0
                    val = max(0.0, float(sim))
                    if art.id not in article_scores or val > article_scores[art.id]:
                        article_scores[art.id] = val
            except Exception as e:
                logger.warning(f"pgvector query error: {e}")

        # 3. Token Overlap Keyword Matching (Hybrid boost / fallback)
        query_words = set(query.lower().split())
        for art_id, art in articles_map.items():
            text_body = f"{art.title} {art.content}".lower()
            matches = sum(1 for w in query_words if len(w) > 3 and w in text_body)
            keyword_score = min(0.99, (matches / max(1, len(query_words))) * 1.5)

            if art_id in article_scores:
                # Blend 70% vector + 30% keyword
                article_scores[art_id] = min(0.99, (0.70 * article_scores[art_id]) + (0.30 * keyword_score))
            elif keyword_score > 0.15:
                article_scores[art_id] = keyword_score

        # 4. Filter and Rank
        scored = [
            (score, articles_map[art_id])
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
            )
            for s, art in scored[:limit]
        ]
