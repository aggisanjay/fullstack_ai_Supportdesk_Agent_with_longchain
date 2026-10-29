from __future__ import annotations

import pytest


def test_settings_load_from_env() -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()

    assert settings.port == 5000 or isinstance(settings.port, int)
    assert settings.session_cookie_name == "session"
    assert len(settings.session_jwt_secret) >= 16


def test_settings_cors_origins() -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.frontend_url in settings.cors_origins


def test_settings_is_development() -> None:
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.is_development is True
    assert settings.is_production is False

