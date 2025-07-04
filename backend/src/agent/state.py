from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from langgraph.graph import add_messages


class ConversationState(TypedDict):
    messages: Annotated[list, add_messages]
    citations: Annotated[list, operator.add]
    web_research_result: Annotated[list, operator.add]
    search_query: Annotated[list, operator.add]
    sources_gathered: Annotated[list, operator.add]
    initial_search_query_count: int
    web_research_result: Annotated[list, operator.add]
    query_list: Annotated[list, operator.add]
    max_research_loops: int
    research_loop_count: int


class ReflectionState(TypedDict):
    is_sufficient: bool
    knowledge_gap: str
    follow_up_queries: Annotated[list, operator.add]
    research_loop_count: int
    max_research_loops: int
    number_of_ran_queries: int


class Query(TypedDict):
    query: str
    rationale: str


class QueryState(TypedDict):
    search_query: list[Query]


class WebResearchState(TypedDict):
    search_query: str
    id: str
