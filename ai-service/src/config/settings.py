from pydantic_settings import BaseSettings
from typing import Optional
import pathlib
class Settings(BaseSettings):
    app_name: str = "Resume Screener AI Service"
    version : str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    openai_api_key: Optional[str] = None
    google_api_key : Optional[str] = None
    groq_api_key: Optional[str] = None
    hf_token: Optional[str] = None
    llm_model: str = "gpt-4o-mini"
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()