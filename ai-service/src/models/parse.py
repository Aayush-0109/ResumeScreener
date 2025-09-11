from pydantic import BaseModel , Field
from typing import List, Optional

class ParseResumeRequest(BaseModel):
    file_content: str = Field(...,description="Base64-encoded file bytes")
    file_name:str = Field(...,description="Original file name, e.g., resume.pdf")
    mime_type:str = Field(...,description="MIME type, e.g., application/pdf")

class ParsedResume(BaseModel):
    name : Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: Optional[int] = None 
    education: Optional[str] = None
