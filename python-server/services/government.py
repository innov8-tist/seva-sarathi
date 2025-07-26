from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import initialize_agent, Tool
from langchain.agents.agent_types import AgentType
from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()
import json
import os
GROQ_API=os.getenv("GROQ_API_KEY")
TAVILY=os.getenv("TAVILY_API")
# Setup LLM
groq=ChatGroq(
    api_key=GROQ_API,
    model_name="gemma2-9b-it",
    temperature=0,
)

search_tool = TavilySearchResults(tavily_api_key=TAVILY)
tools = [
    Tool(
        name="Tavily Web Search",
        func=search_tool.run,
        description="Search the internet for up-to-date information."
    )
]

# Initialize Agent
agent = initialize_agent(
    tools=tools,
    llm=groq,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

def format_to_json(text_results):
    return [{"title": r.get("title", ""), "desc": r.get("content", "")} for r in text_results]

query = "get the current govenrment schemes in india"
# raw_result = agent.invoke({"input":query})
# json_output = format_to_json(raw_result)
# print(json_output)
# raw_result = agent.invoke({"input":query})

def SchemsShowing():
    raw_result=search_tool.run(query)
    json_output = format_to_json(raw_result)
    return json_output


query2="Union Budget 2025: Full List of Government Schemes Announced"
def SchemsShowing2():
    raw_result=search_tool.run(query)
    print(raw_result)



# def Analaysis():
    