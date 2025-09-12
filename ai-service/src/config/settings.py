from pydantic_settings import BaseSettings
from typing import Optional
class Settings(BaseSettings):
    app_name: str = "Resume Screener AI Service"
    version : str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    google_api_key : Optional[str] = None
    groq_api_key: Optional[str] = None
    hf_token: Optional[str] = None
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()