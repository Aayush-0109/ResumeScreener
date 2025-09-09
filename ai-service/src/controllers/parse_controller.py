from fastapi import APIRouter, Body, HTTPException
from src.models.parse import ParseResumeRequest, ParsedResume
from src.models.responses import SuccessResponse
from src.utils.logger import logger
from src.services.parse_service import parse_resume_scaffold
router = APIRouter(prefix="/parse", tags=["parse"])

@router.post("/resume")
def parse_resume(request: ParseResumeRequest = Body(...)):
     try:
        logger.info(f"/parse/resume file={request.file_name} mime={request.mime_type}")
        parsed = parse_resume_scaffold(request)
        return SuccessResponse(message="Parsed (scaffold)", data=parsed.model_dump())
     except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
     except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

