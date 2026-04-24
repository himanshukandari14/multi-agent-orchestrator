"""Create tables from models (dev/bootstrap). Prefer Alembic for production."""

from __future__ import annotations

from app.db import models  # noqa: F401 — register models with Base.metadata
from app.db.base import Base
from app.db.database import engine


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
