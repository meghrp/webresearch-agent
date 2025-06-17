from __future__ import annotations

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph
from state import ConversationState

from schemas import SearchQueryList
from prompts import query_writer_prompt
from utils import get_current_date, get_research_topic


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
    return {"query_list": result.query}


# # Define the graph
# graph = (
#     StateGraph(State, config_schema=Configuration)
#     .add_node(call_model)
#     .add_edge("__start__", "call_model")
#     .compile(name="New Graph")
# )
