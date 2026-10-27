"""Centralised, environment-driven configuration."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", case_sensitive=False, extra="ignore")

    app_name: str = "Khmer Moon Calendar"
    environment: Literal["development", "test", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "json"

    # SQLite keeps zero-config local runs and unit tests working; Docker Compose
    # and production always provide a PostgreSQL URL.
    database_url: str = "sqlite+pysqlite:///./khmer_moon_calendar.db"
    database_echo: bool = False
    database_pool_timeout_seconds: int = 10
    database_statement_timeout_ms: int = 5000

    # NoDecode: accept a plain comma-separated value instead of requiring JSON.
    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["http://localhost:3000"])
    timezone: str = "Asia/Phnom_Penh"
    seed_data_dir: Path = Path(__file__).resolve().parents[3] / "infra" / "database" / "seeds"

    @field_validator("database_url", mode="after")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        # Hosted Postgres (Neon, Render, Heroku-style) hands out postgres:// or postgresql:// URLs;
        # SQLAlchemy would pick psycopg2 for those, but this project ships psycopg 3.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value.removeprefix(prefix)
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            if value.lstrip().startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
