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
    """Create a list of citation objects with segments for the grounding chunks."""
    prefix = f"https://vertexaisearch.cloud.google.com/id/"

    resolved_urls = []
    seen_urls = {}

    for i, site in enumerate(urls_to_resolve):
        url = site.web.uri

        if url not in seen_urls:
            seen_urls[url] = f"{prefix}{id}-{i}"

        segment = {
            "label": (
                site.web.title.split(".")[0]
                if hasattr(site.web, "title") and site.web.title
                else f"Source {i}"
            ),
            "short_url": seen_urls[url],
            "value": url,
        }

        resolved_urls.append({"segments": [segment]})

    return resolved_urls
