from __future__ import annotations

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph
from langgraph.types import Send
from langchain_core.messages import AIMessage
from langgraph.graph import START, END
from agent.state import (
    ConversationState,
    QueryState,
    WebResearchState,
    ReflectionState,
)

from agent.schemas import SearchQueryList, Reflection
from agent.prompts import *
from agent.utils import get_current_date, get_research_topic, resolve_urls

from google.genai import Client

genai_client = Client(api_key=os.getenv("GEMINI_API_KEY"))


def create_queries(state: ConversationState, config) -> dict:
    """Node that creates a list of search queries based on user's question."""
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=1.0,
        max_retries=2,
        api_key=os.getenv("GEMINI_API_KEY"),
    )

    structured_llm = llm.with_structured_output(SearchQueryList)

    formatted_prompt = query_writer_prompt.format(
        current_date=get_current_date(),
        research_topic=get_research_topic(state["messages"]),
    )

    result = structured_llm.invoke(formatted_prompt)
    return {"search_query": result.query}


def continue_to_web_research(state: QueryState):
    """Node that sends the search queries to the web research node."""
    return [
        Send("web_research", {"search_query": search_query, "id": int(idx)})
        for idx, search_query in enumerate(state["search_query"])
    ]


def web_research(state: WebResearchState, config):
    """Node that performs web research with grounding metadata from Gemini 2.0 Flash API."""
    formatted_prompt = web_research_prompt.format(
        current_date=get_current_date(),
        research_topic=state["search_query"],
    )

    response = genai_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=formatted_prompt,
        config={
            "tools": [{"google_search": {}}],
            "temperature": 0,
        },
    )

    resolved_urls = resolve_urls(
        response.candidates[0].grounding_metadata.grounding_chunks, state["id"]
    )

    sources_gathered = [
        item for url_data in resolved_urls for item in url_data["segments"]
    ]

    return {
        "sources_gathered": sources_gathered,
        "search_query": [state["search_query"]],
        "web_research_result": [response.text],
    }


def reflection(state: ConversationState, config) -> ReflectionState:
    """Node that reflects on the web research results and generates follow-up queries."""
    state["research_loop_count"] = state.get("research_loop_count", 0) + 1
    formatted_prompt = reflection_instructions.format(
        current_date=get_current_date(),
        research_topic=get_research_topic(state["messages"]),
        summaries="\n\n---\n\n".join(state["web_research_result"]),
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=1.0,
        max_retries=2,
        api_key=os.getenv("GEMINI_API_KEY"),
    )
    result = llm.with_structured_output(Reflection).invoke(formatted_prompt)

    return {
        "is_sufficient": result.is_sufficient,
        "knowledge_gap": result.knowledge_gap,
        "follow_up_queries": result.follow_up_queries,
        "research_loop_count": state["research_loop_count"],
        "number_of_ran_queries": len(state["search_query"]),
    }


def evaluate_research(state: ReflectionState, config) -> ConversationState:
    """Node that evaluates the research and decides whether to continue or not."""
    max_research_loops = state.get("max_research_loops")
    if max_research_loops is None:
        max_research_loops = config.max_research_loops

    if state["is_sufficient"] or state["research_loop_count"] >= max_research_loops:
        return "generate_answer"
    return [
        Send(
            "web_research",
            {"search_query": followup_query, "id": state["number_of_ran_queries"] + i},
        )
        for i, followup_query in enumerate(state["follow_up_queries"])
    ]


def generate_answer(state: ConversationState, config):
    """Node that finalizes and formats the web research summary"""
    formatted_prompt = answer_instructions.format(
        current_date=get_current_date(),
        research_topic=get_research_topic(state["messages"]),
        summaries="\n---\n\n".join(state["web_research_result"]),
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-pro",
        temperature=0,
        max_retries=2,
        api_key=os.getenv("GEMINI_API_KEY"),
    )
    result = llm.invoke(formatted_prompt)

    sources = []
    for source in state["sources_gathered"]:
        if source["short_url"] in result.content:
            result.content = result.content.replace(
                source["short_url"], source["value"]
            )
            sources.append(source)

    return {
        "messages": [AIMessage(content=result.content)],
        "sources_gathered": sources,
    }


# # Define the graph
builder = StateGraph(ConversationState)

builder.add_node("create_queries", create_queries)
builder.add_node("web_research", web_research)
builder.add_node("reflection", reflection)
builder.add_node("generate_answer", generate_answer)

builder.add_edge(START, "create_queries")
builder.add_conditional_edges(
    "create_queries", continue_to_web_research, ["web_research"]
)
builder.add_edge("web_research", "reflection")
builder.add_conditional_edges(
    "reflection", evaluate_research, ["web_research", "generate_answer"]
)
builder.add_edge("generate_answer", END)

graph = builder.compile(name="webresearch_agent")
