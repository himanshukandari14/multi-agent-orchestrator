"""Postgres record for fix jobs (source of truth for list + ownership)."""

from __future__ import annotations

import logging
import statistics
import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
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


_ACTIVE_STATUSES = frozenset({"queued", "pending", "processing"})


def get_user_fix_metrics(
    db: Session, user_id: uuid.UUID
) -> dict[str, Any]:
    """
    Aggregates for dashboard + analytics: counts, 30d success %, median duration,
    last-7d completed per day, outcome breakdown.
    """
    uid = user_id
    F = models.FixJob

    def _n(where) -> int:
        return int(
            db.scalar(select(func.count()).select_from(F).where(where)) or 0
        )

    completed_total = _n((F.user_id == uid) & (F.status == "completed"))
    failed_total = _n((F.user_id == uid) & (F.status == "failed"))
    in_progress = _n(
        (F.user_id == uid) & (F.status.in_(_ACTIVE_STATUSES))
    )

    now = datetime.now(timezone.utc)
    since_30d = now - timedelta(days=30)
    completed_30d = _n(
        (F.user_id == uid)
        & (F.status == "completed")
        & (F.created_at >= since_30d)
    )
    failed_30d = _n(
        (F.user_id == uid) & (F.status == "failed") & (F.created_at >= since_30d)
    )
    term_30d = completed_30d + failed_30d
    success_rate: int | None
    if term_30d == 0:
        success_rate = None
    else:
        success_rate = int(round(100.0 * completed_30d / term_30d))

    median_seconds: float | None = None
    dur_q = select(
        func.extract(
            "epoch",
            F.updated_at - F.created_at,
        )
    ).where(
        F.user_id == uid,
        F.status == "completed",
    )
    durations = [float(x) for x in db.execute(dur_q).scalars().all() if x is not None]
    if durations:
        median_seconds = float(statistics.median(durations))

    last_7_days: list[dict[str, Any]] = []
    today_utc = now.date()
    for i in range(6, -1, -1):
        d: date = today_utc - timedelta(days=i)
        start = datetime.combine(d, time.min, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        n_completed = int(
            db.scalar(
                select(func.count())
                .select_from(F)
                .where(
                    F.user_id == uid,
                    F.status == "completed",
                    F.updated_at >= start,
                    F.updated_at < end,
                )
            )
            or 0
        )
        last_7_days.append(
            {
                "date": d.isoformat(),
                "label": f"{d.month}/{d.day}",
                "completed": n_completed,
            }
        )

    return {
        "completed_total": completed_total,
        "failed_total": failed_total,
        "in_progress": in_progress,
        "completed_last_30d": completed_30d,
        "failed_last_30d": failed_30d,
        "success_rate_last_30d_pct": success_rate,
        "median_seconds_to_complete": median_seconds,
        "last_7_days": last_7_days,
        "outcomes": {
            "completed": completed_total,
            "failed": failed_total,
            "in_progress": in_progress,
        },
    }
