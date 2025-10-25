"""
Application configuration
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Hopscotch"
    
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./hopscotch.db"
    
    # Redis Settings (for Celery)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AI Settings
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    AI_MODEL: str = "gpt-4"
    
    # Browser History Settings
    CHROME_HISTORY_PATH: str = ""
    SYNC_INTERVAL_MINUTES: int = 30
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
