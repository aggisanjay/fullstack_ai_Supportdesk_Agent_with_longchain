from __future__ import annotations

import json

import pytest
from httpx import AsyncClient


def parse_sse(body: str) -> list[tuple[str, dict]]:
    events: list[tuple[str, dict]] = []
    for block in body.strip().split("\n\n"):
        name, data = "", ""
        for line in block.splitlines():
            if line.startswith("event: "):
                name = line[7:]
            elif line.startswith("data: "):
                data = line[6:]
        if name:
            events.append((name, json.loads(data)))
    return events


@pytest.mark.asyncio
async def test_run_stream_emits_real_node_events_then_done(auth_client: AsyncClient) -> None:
    resp = await auth_client.post(
        "/api/support/run/stream",
        json={"text": "I get a 401 error after rotating our credentials", "provider": "gemini"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/event-stream")

    events = parse_sse(resp.text)
    names = [n for n, _ in events]
    assert names[0] == "start"
    assert names[-1] == "done"

    nodes = [d["node"] for n, d in events if n == "node"]
    assert nodes[0] == "ingest_and_classify"
    assert nodes[1] == "retrieve_knowledge"
    assert nodes[-2:] == ["synthesize_draft", "guardrails_and_accounting"]
    assert all(
        n
        in {
            "ingest_and_classify",
            "retrieve_knowledge",
            "ground_web_search",
            "synthesize_draft",
            "guardrails_and_accounting",
        }
        for n in nodes
    )

    elapsed = [d["elapsedMs"] for n, d in events if n == "node"]
    assert elapsed == sorted(elapsed)  # real, monotonic timings

    done = events[-1][1]
    assert done["ticket"]["id"]
    assert "reply" in done and "detailedSteps" in done

    # the ticket was persisted by the streaming path
    detail = await auth_client.get(f"/api/support/tickets/{done['ticket']['id']}")
    assert detail.status_code == 200


@pytest.mark.asyncio
async def test_run_stream_requires_auth(client: AsyncClient) -> None:
    resp = await client.post("/api/support/run/stream", json={"text": "hello", "provider": "gemini"})
    assert resp.status_code == 401
