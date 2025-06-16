from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from langgraph.graph import add_messages


class ConversationState(TypedDict):
    messages: Annotated[list, add_messages]
    citations: Annotated[list, operator.add]
    web_research_result: Annotated[list, operator.add]

