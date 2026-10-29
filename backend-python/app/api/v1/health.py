"""
Health and status endpoints.
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/status")
async def legacy_status() -> dict[str, Any]:
    return {"ok": True, "status": "UP"}


@router.get("/api/v1/health")
async def health_check() -> dict[str, Any]:
    return {
        "ok": True,
        "status": "UP",
        "version": "0.1.0",
        "timestamp": time.time(),
    }
