from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReguLens"
    environment: str = "development"
    database_url: str = "postgresql+psycopg2://db:5432/regulens"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
