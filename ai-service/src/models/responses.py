from pydantic import BaseModel , Field
from typing import Any,Optional
from datetime import datetime

class BaseResponse(BaseModel):
    success : bool
    message : str
    timestamp : datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseResponse):
    success : bool = False
    error_code : Optional[str] = None

class SuccessResponse(BaseResponse):
    success: bool = True
    data : Optional[Any] = None