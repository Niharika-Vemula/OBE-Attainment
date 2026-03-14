import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = ""
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "obe_db"
    co_attainment_threshold_l1: int = 50
    co_attainment_threshold_l2: int = 60
    co_attainment_threshold_l3: int = 70

    class Config:
        # Look for .env in the backend/ directory (one level up from app/)
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()
