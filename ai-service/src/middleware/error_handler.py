from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from src.models.responses import ErrorResponse
from src.utils.logger import logger
import traceback

async def handle_http_exception(req: Request, exc: HTTPException):
    logger.warning(f"HTTPException: status={exc.status_code} detail={exc.detail}")
    err = ErrorResponse(message=str(exc.detail) if exc.detail else "Request error", error_code="HTTP_ERROR")
    return JSONResponse(status_code=exc.status_code, content=jsonable_encoder(err))

async def handle_validation_error(req: Request, exc: RequestValidationError):
    logger.warning(f"ValidationError: {exc.errors()}")
    err = ErrorResponse(message="Validation error", error_code="VALIDATION_ERROR")
    return JSONResponse(status_code=422, content=jsonable_encoder(err))

async def handle_unexpected_exception(req: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    err = ErrorResponse(message="An error occurred", error_code="INTERNAL_ERROR")
    return JSONResponse(status_code=500, content=jsonable_encoder(err))