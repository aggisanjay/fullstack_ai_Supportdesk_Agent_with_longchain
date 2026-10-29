"""
LLM Provider Service providing robust, multi-provider model instances with fallback.
"""

from __future__ import annotations

import logging

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from app.core.config import Settings, get_settings
from app.core.exceptions import ProviderError

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    def get_model(self, provider: str, temperature: float = 0.2) -> BaseChatModel:
        """Instantiate official provider chat model with timeouts and retries."""
        if provider == "groq":
            if not self.settings.groq_api_key:
                raise ProviderError("groq", "GROQ_API_KEY is not configured")
            return ChatOpenAI(
                model=self.settings.groq_model,
                api_key=self.settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
                temperature=temperature,
                max_retries=1,
                timeout=self.settings.llm_timeout_seconds,
            )
        elif provider == "openai":
            if not self.settings.openai_api_key:
                raise ProviderError("openai", "OPENAI_API_KEY is not configured")
            return ChatOpenAI(
                model="gpt-4o-mini",
                api_key=self.settings.openai_api_key,
                temperature=temperature,
                max_retries=1,
                timeout=self.settings.llm_timeout_seconds,
            )
        else:  # default gemini
            if not self.settings.gemini_api_key:
                raise ProviderError("gemini", "GEMINI_API_KEY is not configured")
            return ChatGoogleGenerativeAI(
                model=self.settings.gemini_model,
                google_api_key=self.settings.gemini_api_key,
                temperature=temperature,
                max_retries=1,
                timeout=self.settings.llm_timeout_seconds,
            )

    def get_model_with_fallback(self, preferred_provider: str) -> tuple[BaseChatModel, str]:
        """Attempt preferred provider, fall back to configured alternatives if available."""
        providers = [preferred_provider]
        for fallback in ["gemini", "groq", "openai"]:
            if fallback not in providers and self.settings.provider_is_configured(fallback):
                providers.append(fallback)

        last_error = None
        for prov in providers:
            try:
                if self.settings.provider_is_configured(prov):
                    return self.get_model(prov), prov
            except Exception as e:
                last_error = e
                logger.warning("Provider %s instantiation failed: %s", prov, e)

        raise ProviderError(
            preferred_provider,
            f"No configured LLM providers available: {last_error}",
        )
