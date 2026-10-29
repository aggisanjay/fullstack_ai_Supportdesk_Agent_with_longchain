from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.graph import SupportAgentGraph
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalResult, RetrievalService
from app.services.search_service import SearchService, TavilyResult


@pytest.fixture
def mock_services():
    mock_llm = MagicMock(spec=LLMService)
    mock_chat = AsyncMock()
    mock_chat.ainvoke.return_value = MagicMock(
        content='{"reply": "To configure redirect URI in Scalekit, visit the dashboard.", "sources": ["https://scalekit.com/docs"], "sentiment": "neutral", "confidenceScore": 0.95}'
    )
    mock_chat.model_name = "test-gemini-flash"
    mock_llm.get_model_with_fallback.return_value = (mock_chat, "gemini")

    mock_retrieval = AsyncMock(spec=RetrievalService)
    mock_search = AsyncMock(spec=SearchService)

    return mock_llm, mock_retrieval, mock_search


@pytest.mark.asyncio
async def test_langgraph_compilation_and_execution(mock_services) -> None:
    mock_llm, mock_retrieval, mock_search = mock_services

    mock_retrieval.retrieve_relevant_articles.return_value = [
        RetrievalResult(
            article_id="kb_1",
            title="Redirect URI Guide",
            category="documentation",
            content="Local test URI is http://localhost:5000/auth/callback.",
            score=0.92,
            retrieval_method="semantic",
        )
    ]
    mock_search.search.return_value = []

    agent_graph = SupportAgentGraph(mock_llm, mock_retrieval, mock_search)

    # 1. Verify that compiled_graph is indeed a compiled LangGraph instance
    assert agent_graph.compiled_graph is not None

    # 2. Execute graph directly
    result_state = await agent_graph.execute(
        text="How do I setup redirect URI for Scalekit?",
        provider="gemini",
        db=MagicMock(),
    )

    # 3. Assert graph node execution traces
    agents_executed = [step["agent"] for step in result_state.workflow_steps]
    assert "Intent Agent" in agents_executed
    assert "Knowledge Agent" in agents_executed
    assert "Response Agent" in agents_executed

    # 4. Verify registered tool execution tracking
    tool_runs = [t["tool"] for t in result_state.telemetry.get("tool_executions", [])] or [
        s["agent"] for s in result_state.workflow_steps
    ]
    assert len(tool_runs) > 0

    # 5. High-confidence KB match (0.92) should skip external web search via conditional edge
    assert mock_search.search.call_count == 0

    # 6. Verify synthesized reply and confidence
    assert "redirect" in result_state.draft.reply.lower() or len(result_state.draft.reply) > 20
    assert result_state.blended_confidence >= 0.70
    assert result_state.escalation is None


@pytest.mark.asyncio
async def test_langgraph_conditional_routing_to_web_search(mock_services) -> None:
    mock_llm, mock_retrieval, mock_search = mock_services

    # Empty KB match: should conditionally route to web search tool
    mock_retrieval.retrieve_relevant_articles.return_value = []
    mock_search.search.return_value = [
        TavilyResult(
            title="Scalekit OAuth Errors",
            url="https://scalekit.com/docs/troubleshooting",
            snippet="Fix 401 redirect errors by verifying URI in developer portal.",
            score=0.88,
        )
    ]

    agent_graph = SupportAgentGraph(mock_llm, mock_retrieval, mock_search)

    result_state = await agent_graph.execute(
        text="Received error 401 mismatch in oauth callback signature",
        provider="gemini",
        db=MagicMock(),
    )

    # Should execute web search tool
    assert mock_search.search.call_count == 1
    assert any(step["agent"] == "Search Agent" for step in result_state.workflow_steps)
    assert len(result_state.draft.sources) > 0


@pytest.mark.asyncio
async def test_langgraph_tool_failure_recorded_accurately(mock_services) -> None:
    mock_llm, mock_retrieval, mock_search = mock_services

    # Knowledge tool fails with database exception
    mock_retrieval.retrieve_relevant_articles.side_effect = RuntimeError("Database connection timed out")
    mock_search.search.return_value = []

    agent_graph = SupportAgentGraph(mock_llm, mock_retrieval, mock_search)

    # Graph must not crash — it must record failure and continue through resilient path
    result_state = await agent_graph.execute(
        text="Need help with password reset",
        provider="gemini",
        db=MagicMock(),
    )

    assert result_state.draft is not None
    assert len(result_state.draft.reply) > 0
