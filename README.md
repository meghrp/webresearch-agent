# webresearch agent - wip

a langgraph agent that uses gemini to perform web backed research on a topic.

### cli example:
use the `cli_research.py` file to accept a research question as an arg or via stdin. 

runs the agent with the questions and returns the final answer with sources.

usage:
~~~sh
python cli_research.py "What is the latest on quantum computing?"
# or
python cli_research.py
# (then type your question then Ctrl-D)
~~~

next up: **ui**
