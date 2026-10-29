"""
Pricing tables and token cost estimation.
"""

from __future__ import annotations

import math

PRICING_TABLE = {
    "gemini-2.5-flash": {"prompt": 0.075 / 1_000_000, "completion": 0.30 / 1_000_000},
    "gemini-1.5-flash": {"prompt": 0.075 / 1_000_000, "completion": 0.30 / 1_000_000},
    "gpt-4o-mini": {"prompt": 0.15 / 1_000_000, "completion": 0.60 / 1_000_000},
    "qwen/qwen3.8-27b": {"prompt": 0.05 / 1_000_000, "completion": 0.20 / 1_000_000},
    "llama-3.3-70b-versatile": {"prompt": 0.59 / 1_000_000, "completion": 0.79 / 1_000_000},
}


def estimate_tokens(text: str) -> int:
    return max(1, math.ceil(len(text) / 4))


def calculate_estimated_cost(model_id: str, prompt_tokens: int, completion_tokens: int) -> tuple[float | None, str]:
    pricing = None
    for key, rate in PRICING_TABLE.items():
        if key in model_id.lower():
            pricing = rate
            break

    if not pricing:
        return None, "Cost unavailable"

    cost = (prompt_tokens * pricing["prompt"]) + (completion_tokens * pricing["completion"])
    return round(cost, 6), f"${cost:.6f} USD"
