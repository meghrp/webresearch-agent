# webresearch agent - wip

a langgraph agent that uses gemini to perform web backed research on a topic.

## run backend
~~~sh
cd backend && pip install .
# run server
langgraph dev
~~~

### cli example:
use the `cli_research.py` file to accept a research question as an arg or via stdin. 

runs the agent with the questions and returns the final answer with sources.

#### usage:

you'll need a gemini api key. use the .env.example file as a template

~~~sh
python cli_research.py "What is the latest on quantum computing?"
# or
python cli_research.py
# (then type your question then Ctrl-D)
~~~

## new: run frontend
added a vibe coded frontend, still wip
~~~sh
cd frontend/ && npm install
npm run dev
~~~
