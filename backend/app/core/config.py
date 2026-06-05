from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import json


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "污水处理站运维管理平台"
    BACKEND_CORS_ORIGINS: str = '["http://localhost:5173", "http://localhost:80"]'
    
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: str = "3306"
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = "password"
    DATABASE_NAME: str = "sewage_management"
    
    class Config:
        env_file = ".env"
    
    @property
    def CORS_ORIGINS(self) -> list[str]:
        return json.loads(self.BACKEND_CORS_ORIGINS)
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"mysql+pymysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}?charset=utf8mb4"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
