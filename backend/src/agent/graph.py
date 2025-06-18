from __future__ import annotations

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, Send
from state import *

from schemas import SearchQueryList, Reflection
from prompts import query_writer_prompt, web_research_prompt, reflection_instructions
from utils import get_current_date, get_research_topic, resolve_urls

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
        research_topic=get_research_topic(state["search_query"]),
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

# # Define the graph
# graph = (
#     StateGraph(State, config_schema=Configuration)
#     .add_node(call_model)
#     .add_edge("__start__", "call_model")
#     .compile(name="New Graph")
# )
