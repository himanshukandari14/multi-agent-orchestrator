"""Postgres record for fix jobs (source of truth for list + ownership)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


def create_fix_job(
    db: Session,
    *,
    job_id: str,
    user_id: uuid.UUID,
    repo_url: str,
    issue_title: str,
    issue_id: int | None,
    repo_label: str | None,
) -> models.FixJob:
    row = models.FixJob(
        job_id=job_id,
        user_id=user_id,
        repo_url=repo_url,
        issue_title=issue_title,
        issue_id=issue_id,
        repo_label=repo_label,
        status="queued",
        progress=0,
        message=None,
        result=None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_fix_job_record(job_id: str, **kwargs: Any) -> None:
    """Sync worker/API Redis updates to Postgres (no-op if row missing)."""
    allowed = {"status", "progress", "message", "result"}
    patch = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
    if not patch:
        return
    try:
        with SessionLocal() as db:
            row = db.get(models.FixJob, job_id)
            if not row:
                return
            for k, v in patch.items():
                setattr(row, k, v)
            db.commit()
    except Exception:
        logger.exception("fix_job db sync failed for %s", job_id)


def get_fix_job_for_user(
    db: Session, job_id: str, user_id: uuid.UUID
) -> models.FixJob | None:
    row = db.get(models.FixJob, job_id)
    if not row or row.user_id != user_id:
        return None
    return row


def list_fix_jobs_for_user(
    db: Session, user_id: uuid.UUID, limit: int = 50
) -> list[models.FixJob]:
    q = (
        select(models.FixJob)
        .where(models.FixJob.user_id == user_id)
        .order_by(models.FixJob.created_at.desc())
        .limit(min(limit, 100))
    )
    return list(db.execute(q).scalars().all())
