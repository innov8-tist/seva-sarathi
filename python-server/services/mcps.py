from agno.tools.mcp import MultiMCPTools, StreamableHTTPClientParams
from agno.agent import Agent      
from agno.models.groq import Groq
from dotenv import load_dotenv
import os
import json
import datetime
from tzlocal import get_localzone_name
load_dotenv()
CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET")
GROQ=os.getenv("GROQ_API_KEY")
from mcp import StdioServerParameters
async def Run_Agent(query:str,arr:list):
    mcp_gmail = StdioServerParameters(
                command="npx",
                args=["@gongrzhe/server-gmail-autoauth-mcp"],
                env={
                    "GOOGLE_CLIENT_ID": CLIENT_ID,
                    "GOOGLE_CLIENT_SECRET": CLIENT_SECRET,
                    "GMAIL_CREDENTIALS_PATH": "",
                },
        )
    mcp_tools_calender = StdioServerParameters(
            command="npx",
            args=["@gongrzhe/server-calendar-mcp"],
            env={
                "GOOGLE_CLIENT_ID": CLIENT_ID,
                "GOOGLE_CLIENT_SECRET": CLIENT_SECRET,
                "GOOGLE_REFRESH_TOKEN": "",
            },
        )
    drive_path = os.path.join(os.path.dirname(__file__), "services", "drive-server.py")
    mcp_drive_tools = StdioServerParameters(
            command="uv",
            args=["run", drive_path],
            env={
                "GOOGLE_CLIENT_ID": CLIENT_ID,
                "GOOGLE_CLIENT_SECRET": CLIENT_SECRET,
                "GOOGLE_REFRESH_TOKEN": ""
            }
    )
    HashMap = {"gmail": mcp_gmail,"calender":mcp_tools_calender}
    tools = []
    Flag=False
    for key,val in enumerate(arr):
        name = val.get("name")
        if "gmail" in HashMap:
            auth_credentials = val["auth_credentails"]
            print(auth_credentials)
            creds_path = os.path.join(
                 os.getcwd(),
                 f"creds_{val.get('user_id')}_{name}.json",
             )
            Flag=True
            with open(creds_path, "w") as f:
                 json.dump(auth_credentials, f)
                 HashMap["gmail"].env["GMAIL_CREDENTIALS_PATH"] = creds_path
                 tools.append(HashMap["gmail"])
        if "calender" in HashMap:
                HashMap["calender"].env["GOOGLE_REFRESH_TOKEN"] = val["auth_credentails"][
                    "refresh_token"
                ]
                tools.append(HashMap["calender"])
        if "drive" in HashMap:
                HashMap["drive"].env["GOOGLE_REFRESH_TOKEN"] = val["auth_credentails"][
                    "refresh_token"
                ]
                tools.append(HashMap["drive"])
        print(mcp_drive_tools)
    # ----------------------------------------------------AGENT CALLIMG-------------------------------------------------------------------------------------
    async with MultiMCPTools(server_params_list=tools, timeout_seconds=30.0) as mcp_tools_main:
            print(mcp_tools_main)
            agent = Agent(
                    model=Groq(
                        id="llama-3.3-70b-versatile",
                        api_key=GROQ
                    ),
                    tools=[mcp_tools_main],
                    instructions=[
                        f"""
                        You are a smart assistant. Today is {datetime.datetime.now()} it is an **indian time**(IMPORTANT) and the user's timezone is {get_localzone_name()}.

                        Your job is to help users manage their Gmail,Calender,Drive accounts efficiently. You have access to tools that allow you to perform the following actions:

                        **Gmail:**
                        - List, search, and read emails
                        - Draft, send, and reply to emails
                        - Identify important or unread messages
                        - Other email management tasks
                        
                        **Google Calendar:**
                        - Retrieve scheduled events from a specific date and time
                        - Create new calendar events based on provided details
                        - Suggest optimal time slots based on availability
                        - Other calendar-related operations
                        
                        **Google Drive:**
                        - List and search files with pagination
                        - Upload, download, rename, delete files or folders
                        - Create folders and share with emails
                        - Retrieve file metadata like size, type, timestamps
                        
                        Please always confirm details with the user when necessary, and ensure you use the correct tool for each task.

                        If a requested action requires a tool that is not currently enabled, respond with:
                        "Please enable the [name] tool to proceed (e.g., Gmail,Calender,drive)."

                        If you lack permission or access to a specific tool, respond with:
                        "I don't have access to the [name] tool at the moment."
                        """
                    ],
                    markdown=True,
                    show_tool_calls=True,
                    retries=2,
                )
            if Flag==True and os.path.exists(creds_path):
                Flag=False
                os.remove(creds_path)
            response = await agent.arun(query)
    return {"result":str(response.content)}
