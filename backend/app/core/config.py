import json
from typing import Any, List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReguLens"
    environment: str = "development"
    database_url: str = "sqlite:///./regulens.db"
    # AI Provider Settings (Options: "gemini" [Primary], "nvidia" [Fallback])
    ai_provider: str = "gemini"
    ai_fallback_enabled: bool = True

    # NVIDIA Nemotron Configuration
    nvidia_api_key: str | None = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "nvidia/nemotron-3-ultra-550b-a55b"

    # Google Gemini Configuration (Fallback / Secondary)
    gemini_api_key: str | None = None
    gemini_api_key_rishav: str | None = None
    gemini_model: str = "models/gemini-3.6-flash"
    secret_key: str = "regulens-sih-prototype-secret-key-change-in-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    max_upload_size_mb: int = 20
    seed_demo_user: bool = True
    demo_user_email: str = "admin@regulens.ai"
    demo_user_password: str = "Admin@123"
    demo_user_name: str = "Compliance Officer"
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: Any) -> str:
        if isinstance(v, str):
            val = v.strip()
            if val.startswith("postgres://"):
                return "postgresql://" + val[len("postgres://"):]
            return val
        return "sqlite:///./regulens.db"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            val = v.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in val.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

