"""
Tavily Search wrapper service.
"""

from __future__ import annotations

import logging
from typing import Any, List
from pydantic import BaseModel
from tavily import TavilyClient

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


class TavilyResult(BaseModel):
    title: str
    url: str
    snippet: str


class SearchService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    async def search(self, query: str, max_results: int = 3) -> List[TavilyResult]:
        if not self.settings.tavily_api_key or len(self.settings.tavily_api_key) < 5:
            logger.info("Tavily API key not configured, returning empty search results.")
            return []

        try:
            client = TavilyClient(api_key=self.settings.tavily_api_key)
            res = client.search(query=query, max_results=max_results, search_depth="basic")
            raw_results = res.get("results", [])
            return [
                TavilyResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("content", ""),
                )
                for item in raw_results
            ]
        except Exception as e:
            logger.warning("Tavily search failed for query '%s': %s", query, e)
            return []

