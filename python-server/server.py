from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.schema import MYAI
from services.rag import PDFRAG
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
async def greet(query: MYAI):
    result = await PDFRAG(query=query.query)
    return {"result":result['result']}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
