from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse,FileResponse
from google_auth_oauthlib.flow import Flow
import pathlib
import os
import uvicorn
from services.schema import MYAI,MYCOLL
from services.rag import PDFRAG
from services.db import DBDATAS,DBDATAS2
from services.mcps import Run_Agent
import json
from services.drive import Download_Function
from services.government import SchemsShowing
user_id=None
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI"}

@app.post("/myai/")
async def RaggingSystem(query: MYAI):
    result = await PDFRAG(query=query.query)
    return {"result":result['result']}

@app.post("/mycollections/")
async def McpServers(datas:MYCOLL):
    question=datas.query
    user_id=datas.user_id
    collected_info=DBDATAS(user_id)

    res=await Run_Agent(query=question,arr=[collected_info])
    return {"result":res}
    
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ✅ Set constants
CLIENT_SECRETS_FILE = "D:/Code-recet/seva-sarathi/python-server/.gmail-mcp/gcp-oauth.keys.json"
SCOPES=[
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar"
]

REDIRECT_URI = "http://localhost:8000/oauth2callback"

@app.get("/generate-auth-url")
async def generate_auth_url(user_id_from_client: str):
    global user_id
    user_id=user_id_from_client
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(
    access_type='offline',
    include_granted_scopes=False,
    prompt='consent'          
    )
    return JSONResponse(content={"auth_url": auth_url})

@app.get("/oauth2callback")
async def oauth2callback(request: Request):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    # ✅ Automatically extracts `code` and `state` from the URL
    flow.fetch_token(authorization_response=str(request.url))

    credentials = flow.credentials
    token_path = pathlib.Path(__file__).parent / "token.json"
    #token_path.write_text(credentials.to_json())
    refresh_token_data = json.loads(credentials.to_json())
    print(refresh_token_data)
    global user_id
    DBDATAS2(refresh_token_data,user_id)
    return HTMLResponse(content="""
    <html>
      <body>
        <script>
          window.close();
        </script>
        <p>✅ Authorization successful! You can close this tab.</p>
      </body>
    </html>
    """)

DOWNLOAD_DIR="services/download"
@app.get("/list-files")
def list_files():
    Download_Function()
    if not os.path.exists(DOWNLOAD_DIR):
        return JSONResponse(status_code=404, content={"message": "Download directory not found"})

    files = os.listdir(DOWNLOAD_DIR)
    file_data = [
        {
            "filename": filename,
            "download_url": f"/download/{filename}"
        }
        for filename in files if os.path.isfile(os.path.join(DOWNLOAD_DIR, filename))
    ]
    return file_data

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(DOWNLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    return JSONResponse(status_code=404, content={"message": "File not found"})
@app.get("/government-schemes")
def SchemsShow():
    res=SchemsShowing()
    return {"result":res}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
