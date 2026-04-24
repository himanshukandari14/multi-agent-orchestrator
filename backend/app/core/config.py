"""App settings (env-driven)."""
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> …/backend
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_REPO_ROOT = _BACKEND_DIR.parent

# Repo root `.env` is found when running `uvicorn` from `backend/`; optional `backend/.env` overrides.
_seen: set[Path] = set()
_env_list: list[Path] = []
for p in (_REPO_ROOT / ".env", _BACKEND_DIR / ".env"):
    if p.is_file():
        r = p.resolve()
        if r not in _seen:
            _seen.add(r)
            _env_list.append(r)
_ENV_FILES = tuple(_env_list)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES or None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(
        ...,
        validation_alias=AliasChoices("DATABASE_URL", "DB_URL"),
        description="Neon Postgres URL, e.g. postgresql+psycopg://user:pass@host/db",
    )
    dodo_payments_api_key: str | None = Field(
        default=None, alias="DODO_PAYMENTS_API_KEY"
    )
    dodo_webhook_key: str | None = Field(
        default=None,
        alias="DODO_PAYMENTS_WEBHOOK_KEY",
        description="Webhook signing secret (standardwebhooks) from Dodo dashboard",
    )
    dodo_environment: str = Field(
        default="test_mode",
        alias="DODO_PAYMENTS_ENV",
        description="test_mode or live_mode",
    )
    dodo_product_id_pro: str | None = Field(
        default=None, alias="DODO_PRODUCT_ID_PRO"
    )
    dodo_product_id_pro_plus: str | None = Field(
        default=None, alias="DODO_PRODUCT_ID_PRO_PLUS"
    )
    frontend_url: str = Field(
        default="http://localhost:3000", alias="FRONTEND_URL"
    )
    app_public_url: str = Field(
        default="http://localhost:8000", alias="APP_PUBLIC_URL"
    )
    jwt_secret: str = Field(..., alias="JWT_SECRET", description="HS256 secret for app JWTs")

    @field_validator("database_url")
    @classmethod
    def require_asyncpg_driver(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        if "postgresql" in v and "+psycopg" not in v and "postgresql+psycopg" not in v:
            # allow plain postgresql:// — SQLAlchemy needs driver
            v = v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
