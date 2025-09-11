

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from src.config.settings import settings
from src.utils.logger import logger
from src.models.responses import SuccessResponse, ErrorResponse
from src.middleware.error_handler import  handle_http_exception, handle_unexpected_exception, handle_validation_error
from fastapi.middleware.cors import CORSMiddleware
from src.controllers.parse_controller import router as parse_router
from src.controllers.matching_controller import router as matching_router

app = FastAPI(
    title = settings.app_name,
    version = settings.version,
    debug = settings.debug
)

app.include_router(parse_router)
app.include_router(matching_router)
app.add_middleware(
 CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"])
app.add_exception_handler(HTTPException, handle_http_exception)
app.add_exception_handler(RequestValidationError, handle_validation_error)
app.add_exception_handler(Exception, handle_unexpected_exception)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")

    return SuccessResponse(
        message= "AI Service is running",
        data= {"service" : "ai-service"}
    )

@app.get("/health")
def health_check():
    logger.info("Health check endpoint accessed")
    return SuccessResponse(
        message="Service is healthy",
        data={"status": "healthy", "service": "ai-service"}
    ) 