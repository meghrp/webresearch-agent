from typing import List
from datetime import datetime
from langchain_core.messages import AIMessage, HumanMessage


def get_current_date():
    return datetime.now().strftime("%B %d, %Y")


def get_research_topic(messages) -> str:
    """
    Get the research topic from the messages.
    """
    # check if request has a history and combine the messages into a single string
    if len(messages) == 1:
        research_topic = messages[-1].content
    else:
        research_topic = ""
        for message in messages:
            if isinstance(message, HumanMessage):
                research_topic += f"User: {message.content}\n"
            elif isinstance(message, AIMessage):
                research_topic += f"Assistant: {message.content}\n"
    return research_topic


def resolve_urls(urls_to_resolve, id):
    """Create a map of the vertex ai search urls (very long) to a short url with a unique id for each url."""
    prefix = f"https://vertexaisearch.cloud.google.com/id/"
    urls = [site.web.uri for site in urls_to_resolve]

    resolved = {}
    for idx, url in enumerate(urls):
        if url not in resolved:
            resolved[url] = f"{prefix}{id}-{idx}"

    return resolved
