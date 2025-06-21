import sys
import argparse
import os
from agent import graph
from langchain_core.messages import HumanMessage


def main():
    parser = argparse.ArgumentParser(
        description="Run the web research agent from the command line."
    )
    parser.add_argument(
        "question",
        nargs="*",
        help="The research question to answer. If omitted, reads from stdin.",
    )
    parser.add_argument(
        "--max_loops", type=int, default=2, help="Maximum research loops (default: 2)"
    )
    args = parser.parse_args()

    if args.question:
        question = " ".join(args.question)
    else:
        print("Enter your research question (end with Ctrl-D):")
        question = sys.stdin.read().strip()

    if not question:
        print("No question provided.")
        sys.exit(1)

    state = {
        "messages": [HumanMessage(content=question)],
        "citations": [],
        "web_research_result": [],
        "search_query": [],
        "sources_gathered": [],
        "query_list": [],
        "max_research_loops": args.max_loops,
        "research_loop_count": 0,
    }

    print("Running agent...\n")
    result = graph.invoke(state)

    messages = result.get("messages", [])
    if messages:
        print("=== FINAL ANSWER ===\n")
        print(messages[-1].content)
        print()
    else:
        print("No answer generated.")

    sources = result.get("sources_gathered", [])
    if sources:
        print("=== SOURCES ===\n")
        for src in sources:
            print(f"- {src['label']}: {src['value']}")
    else:
        print("No sources found.")


if __name__ == "__main__":
    main()
