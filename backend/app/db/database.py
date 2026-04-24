from app.core.config import get_settings
from app.db.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_settings = get_settings()
engine = create_engine(
    _settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)

__all__ = ["Base", "engine", "SessionLocal"]
