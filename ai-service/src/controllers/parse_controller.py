from fastapi import APIRouter, Body
from src.models.parse import ParseResumeRequest
from src.utils.logger import logger
from src.services.parse_service import parse_resume_llm

router = APIRouter(prefix="/parse", tags=["parse"])

@router.post("/resume")
def parse_resume(request: ParseResumeRequest = Body(...)):
    logger.info(f"/parse/resume file={request.file_name} mime={request.mime_type}")
    parsed, source = parse_resume_llm(request)
    return {
        "success": True,
        "message": "Parsed",
        "data": {
            "parsed": parsed.model_dump(),
            "meta": {"source": source}
        }
    }