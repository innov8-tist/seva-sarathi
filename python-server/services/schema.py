from pydantic import BaseModel
class MYAI(BaseModel):
    query: str
    
class MYCOLL(BaseModel):
    query:str
    user_id:str