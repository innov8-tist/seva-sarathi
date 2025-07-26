from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import initialize_agent, Tool
from langchain.agents.agent_types import AgentType
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
load_dotenv()
import json
import os
GEMINI=os.getenv("GEMINI_API_KEY")
TAVILY=os.getenv("TAVILY_API")
GROQ=os.getenv("GROQ_API_KEY")
# Setup LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=GEMINI
    # other params...
)
groq=ChatGroq(
    api_key=GROQ,
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
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True
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



# SchemsShowing2()



def load_and_process_data_pdf():
    try:
        final_text = ""
        DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "download")
        for file_name in os.listdir(DOWNLOAD_DIR):
            if file_name.endswith(".pdf"):
                file_path = os.path.join(DOWNLOAD_DIR, file_name)
                if os.path.isfile(file_path):
                    loader = PyPDFLoader(file_path)
                    texts = loader.load()
                    for doc in texts:
                        final_text += doc.page_content + "\n"
    
        return {"text": final_text}

    except Exception as e:
        print(f"Error loading PDFs: {e}")
        return {"text": ""}
# def Analaysis():




class ExtractRelevantDocuments(BaseModel):
    missing_info: list[str] = Field(
            description="""
    A list of important documents or details that are **missing** and required to evaluate the user's eligibility for government schemes.
    These should be clearly labeled as missing.
    """
        )
    available_info: list[str] = Field(
            description="""
    A list of details that are **already available** in the user's documents.
    Each item should be a simple, human-readable sentence describing the available information.
    """
        )
    
def SchemsShowing2(query:str):
    final_text=load_and_process_data_pdf()
    query2 = f"""
You are an assistant that helps users identify which government schemes a person may be eligible for based on the Union Budget 2025 announcements.

The user's personal information has been extracted from documents. Your task is to analyze the data and:

1. Identify the names of the important documents or details that are **missing** and required to evaluate the user's eligibility.
2. Identify the names of the documents or details that are **already available**.

### USER DOCUMENT DATA (EXTRACTED):
{final_text}

### USER QUERY:
{query}

### OUTPUT FORMAT:
Return only a **raw JSON object**, with no explanation or markdown formatting. Do **not** use triple backticks (` ``` `) or labels like `json`.

Format:
{{
  "missing_info": ["Aadhaar card", "Income certificate"],
  "available_info": ["PAN card", "Ration card"]
}}
"""

    raw_result=agent.invoke({"input":query2})
    
    print("_________________________________________________________________________________")
    print(raw_result['output'])
    output = raw_result.get('output', '').strip()

    if not output:
        raise ValueError("Output is empty. Cannot parse JSON.")

    # Remove triple backticks if present
    if output.startswith("```json") or output.startswith("```"):
        output = output.strip("`")
        output = output.replace("json", "").strip()

    # Try parsing
    try:
        data = json.loads(output)
    except json.JSONDecodeError as e:
        print("Failed to decode JSON:", e)
        print("Raw output string was:", repr(output))
        raise
    print("_________________________________________________________________________________")
    return data