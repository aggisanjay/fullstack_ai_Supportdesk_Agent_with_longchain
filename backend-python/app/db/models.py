"""
SQLAlchemy ORM models defining all domain entities.
"""

from __future__ import annotations

import uuid
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="agent", nullable=False)


class Ticket(Base, TimestampMixin):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", index=True, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(32), default="neutral", nullable=False)
    intent_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    intent_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    confidence_breakdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sources: Mapped[list[str] | None] = mapped_column(JSON, default=list, nullable=True)
    search_query: Mapped[str | None] = mapped_column(Text, nullable=True)
    search_results: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    retrieval_status: Mapped[str] = mapped_column(String(32), default="none", nullable=False)

    # Execution traces and telemetry
    workflow_steps: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=list, nullable=True)
    detailed_steps: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=list, nullable=True)
    telemetry: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    escalation: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    messages: Mapped[list[TicketMessage]] = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at",
    )


class TicketMessage(Base, TimestampMixin):
    __tablename__ = "ticket_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ticket_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tickets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender: Mapped[str] = mapped_column(String(32), nullable=False)  # "customer" | "agent" | "ai"
    text: Mapped[str] = mapped_column(Text, nullable=False)

    ticket: Mapped[Ticket] = relationship("Ticket", back_populates="messages")


class KBArticle(Base, TimestampMixin):
    __tablename__ = "kb_articles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    chunks: Mapped[list[DocumentChunk]] = relationship(
        "DocumentChunk",
        back_populates="article",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.chunk_index",
    )


class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex[:16])
    article_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("kb_articles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Embedding vector stored as native pgvector column (1536 dims)
    embedding = mapped_column(Vector(1536), nullable=True)
    chunk_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=dict, nullable=True)

    article: Mapped[KBArticle] = relationship("KBArticle", back_populates="chunks")


class TelemetryRecord(Base, TimestampMixin):
    __tablename__ = "telemetry_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex[:16])
    request_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    actual_model: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_token_count_estimated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    estimated_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    outcome: Mapped[str] = mapped_column(
        String(32), default="success", nullable=False
    )  # "success" | "failed" | "fallback"
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    latencies: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    ticket_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
