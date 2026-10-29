"""
Application settings loaded from environment variables with Pydantic validation.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    port: int = Field(default=5000, description="HTTP listen port")
    node_env: Literal["development", "production", "test"] = Field(
        default="development", description="Runtime environment"
    )
    backend_url: str = Field(default="http://localhost:5000", description="Public backend origin")
    frontend_url: str = Field(default="http://localhost:5173", description="Allowed CORS frontend origin")

    session_cookie_name: str = Field(default="session", description="JWT cookie name")
    session_jwt_secret: str = Field(
        default="default_dev_secret_jwt_key_32bytes!",
        min_length=16,
        description="HMAC-SHA256 signing secret for session JWTs",
    )
    session_jwt_expiry_days: int = Field(default=7, description="JWT token expiry in days")

    scalekit_environment_url: str = Field(default="", description="Scalekit environment URL")
    scalekit_client_id: str = Field(default="", description="Scalekit OAuth client ID")
    scalekit_client_secret: str = Field(default="", description="Scalekit OAuth client secret")

    openai_api_key: str = Field(default="", description="OpenAI API key")
    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    gemini_model: str = Field(default="gemini-2.5-flash", description="Gemini model name")
    groq_api_key: str = Field(default="", description="Groq API key")
    groq_model: str = Field(default="qwen/qwen3.8-27b", description="Groq model name")
    tavily_api_key: str = Field(default="", description="Tavily Search API key")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/supportdesk",
        description="Async SQLAlchemy database URL",
    )
    database_url_sync: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/supportdesk",
        description="Sync database URL for Alembic migrations",
    )

    embedding_model: str = Field(default="text-embedding-3-small", description="Embedding model identifier")
    embedding_dimensions: int = Field(default=1536, description="Vector dimensions for pgvector")
    chunk_size: int = Field(default=512, description="Token count per document chunk")
    chunk_overlap: int = Field(default=64, description="Overlap tokens between chunks")
    retrieval_top_k: int = Field(default=5, description="Number of chunks to retrieve")
    similarity_threshold: float = Field(default=0.3, description="Minimum cosine similarity")

    e2e_test_mode: bool = Field(default=True, description="Enable dev-only E2E auth routes")

    llm_timeout_seconds: int = Field(default=30, description="LLM provider call timeout")
    max_tool_calls_per_run: int = Field(default=8, description="Agent tool-call limit per run")
    max_output_tokens: int = Field(default=2048, description="Max tokens in LLM response")

    @property
    def is_production(self) -> bool:
        return self.node_env == "production"

    @property
    def is_development(self) -> bool:
        return self.node_env == "development"

    @property
    def cors_origins(self) -> list[str]:
        origins = [self.frontend_url]
        if self.is_development:
            origins.extend(
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5000",
                    "http://127.0.0.1:5000",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                ]
            )
        return list(dict.fromkeys(origins))

    def provider_is_configured(self, provider: str) -> bool:
        key_map = {
            "gemini": self.gemini_api_key,
            "openai": self.openai_api_key,
            "groq": self.groq_api_key,
            "tavily": self.tavily_api_key,
        }
        key = key_map.get(provider, "")
        return bool(key and len(key.strip()) > 5)


@lru_cache
def get_settings() -> Settings:
    return Settings()
