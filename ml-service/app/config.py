import os
from functools import lru_cache
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings  # fallback


class Settings(BaseSettings):
    """
    Application Configuration Settings
    Loaded from environment variables or default values.
    """
    SERVICE_NAME: str = "hostel-ml-service"
    VERSION: str = "0.1.0"
    ENV: str = os.getenv("ENV", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of system settings."""
    return Settings()
