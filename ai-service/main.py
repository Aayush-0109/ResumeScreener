from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from src.config.settings import settings
from src.utils.logger import logger
from src.models.responses import SuccessResponse, ErrorResponse
from src.middleware.error_handler import error_handler
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title = settings.app_name,
    version = settings.version,
    debug = settings.debug
)

app.add_middleware(
 CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # adjust later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"])
app.add_exception_handler(Exception , error_handler)
app.add_exception_handler(RequestValidationError , error_handler)

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