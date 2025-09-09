from email import message
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from src.models.responses import ErrorResponse
from src.utils.logger import logger
import traceback
async def error_handler(req : Request ,exc :Exception):
    logger.error(f"Error occurred: {str(exc)}")
    logger.error(f"Traceback:  {traceback.format_exc()}")

    error_response = ErrorResponse(
       message="An error occurred",
        error_code="INTERNAL_ERROR"
    )

    return JSONResponse(
        status_code = 500,
        content = error_response.dict()
    ) 