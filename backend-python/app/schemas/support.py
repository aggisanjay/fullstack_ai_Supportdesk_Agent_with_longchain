"""
Pydantic schemas matching the original Express API contract.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ProviderType = Literal["gemini", "groq", "openai"]
SentimentType = Literal["positive", "neutral", "frustrated", "critical"]
IntentCategoryType = Literal[
    "billing",
    "technical/integration",
    "account/access",
    "bug report",
    "feature request",
    "general",
]


class SupportRunRequest(BaseModel):
    provider: ProviderType = Field(default="gemini")
    text: str = Field(min_length=1, max_length=10000)
    ticketId: str | None = None
    title: str | None = None
    customerName: str | None = None
    customerEmail: str | None = None


class IntentClassification(BaseModel):
    intentCategory: IntentCategoryType = Field(default="general")
    intentSummary: str = Field(default="Customer inquiry regarding platform capabilities.")
    requiresWebSearch: bool = Field(default=False)
    searchReasoning: str = Field(default="Query evaluated against internal knowledge base.")


class DraftResponse(BaseModel):
    reply: str = Field(min_length=1)
    sources: list[str] = Field(default_factory=list)
    sentiment: SentimentType = Field(default="neutral")
    confidenceScore: float = Field(default=0.8, ge=0.0, le=1.0)
    intentCategory: str | None = None
    intentSummary: str | None = None
    confidenceBreakdown: str | None = None


class KBArticleCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    category: Literal["faq", "documentation", "internal", "troubleshooting"]
    content: str = Field(min_length=5, max_length=50000)


class KBArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    category: Literal["faq", "documentation", "internal", "troubleshooting"] | None = None
    content: str | None = Field(default=None, min_length=5, max_length=50000)


class TicketCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    customerName: str | None = Field(default=None, max_length=100)
    customerEmail: str = Field(max_length=255)
    status: Literal["open", "pending", "resolved", "escalated"] = Field(default="open")
    text: str = Field(min_length=1, max_length=10000)


class TicketUpdate(BaseModel):
    status: Literal["open", "pending", "resolved", "escalated"]


class TicketMessageCreate(BaseModel):
    sender: Literal["customer", "agent", "ai"]
    text: str = Field(min_length=1, max_length=10000)
    resolveTicket: bool | None = False
