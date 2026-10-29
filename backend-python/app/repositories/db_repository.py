"""
Repository layer providing clean CRUD operations on Domain Models.
"""

from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import KBArticle, TelemetryRecord, Ticket, TicketMessage


class KBRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[KBArticle]:
        result = await self.db.execute(select(KBArticle).order_by(KBArticle.created_at.desc()))
        return list(result.scalars().all())

    async def get_by_id(self, article_id: str) -> KBArticle | None:
        result = await self.db.execute(
            select(KBArticle).options(selectinload(KBArticle.chunks)).where(KBArticle.id == article_id)
        )
        return result.scalar_one_or_none()

    async def create(self, id: str, title: str, category: str, content: str) -> KBArticle:
        article = KBArticle(id=id, title=title, category=category, content=content)
        self.db.add(article)
        await self.db.flush()
        return article

    async def update(self, article_id: str, **kwargs) -> KBArticle | None:
        article = await self.get_by_id(article_id)
        if not article:
            return None
        for key, val in kwargs.items():
            if val is not None and hasattr(article, key):
                setattr(article, key, val)
        await self.db.flush()
        return article

    async def delete(self, article_id: str) -> bool:
        article = await self.get_by_id(article_id)
        if not article:
            return False
        await self.db.delete(article)
        await self.db.flush()
        return True


class TicketRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Ticket]:
        result = await self.db.execute(
            select(Ticket).options(selectinload(Ticket.messages)).order_by(Ticket.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, ticket_id: str) -> Ticket | None:
        result = await self.db.execute(
            select(Ticket).options(selectinload(Ticket.messages)).where(Ticket.id == ticket_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Ticket:
        if "id" not in kwargs or not kwargs["id"]:
            kwargs["id"] = "t_" + uuid.uuid4().hex[:8]
        ticket = Ticket(**kwargs)
        self.db.add(ticket)
        await self.db.flush()
        return ticket

    async def update(self, ticket_id: str, **kwargs) -> Ticket | None:
        ticket = await self.get_by_id(ticket_id)
        if not ticket:
            return None
        for key, val in kwargs.items():
            if val is not None and hasattr(ticket, key):
                setattr(ticket, key, val)
        await self.db.flush()
        return ticket

    async def add_message(self, ticket_id: str, sender: str, text: str) -> TicketMessage:
        msg = TicketMessage(
            id="msg_" + uuid.uuid4().hex[:10],
            ticket_id=ticket_id,
            sender=sender,
            text=text,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def clear_all(self) -> None:
        await self.db.execute(delete(TicketMessage))
        await self.db.execute(delete(Ticket))
        await self.db.flush()


class TelemetryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(self, **kwargs) -> TelemetryRecord:
        record = TelemetryRecord(**kwargs)
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_recent(self, limit: int = 50) -> list[TelemetryRecord]:
        result = await self.db.execute(select(TelemetryRecord).order_by(TelemetryRecord.created_at.desc()).limit(limit))
        return list(result.scalars().all())
