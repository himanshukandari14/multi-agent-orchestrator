from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.queue.redis import queue, redis_conn
from app.services.fix_job_db import (
    create_fix_job,
    get_user_fix_metrics,
    list_fix_jobs_for_user,
)
from app.services.job_runner import run_job
from app.utils.job_tracker import create_job

router = APIRouter()


class FixIssueBody(BaseModel):
    repo_url: str
    issue: str = Field(..., description="Issue title for the run")
    issue_id: int | None = None
    repo_label: str | None = None


def _row_to_list_item(r: Any) -> dict[str, Any]:
    return {
        "job_id": r.job_id,
        "status": r.status,
        "progress": r.progress,
        "message": r.message or "",
        "result": r.result,
        "repo_url": r.repo_url,
        "issue_title": r.issue_title,
        "issue_id": r.issue_id,
        "repo_label": r.repo_label,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


@router.get("/fix/metrics")
def get_fix_metrics(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Dashboard + analytics: real aggregates from `fix_jobs`."""
    uid = uuid.UUID(user["user_id"])
    return get_user_fix_metrics(db, uid)


@router.get("/fix/jobs")
def list_my_fix_jobs(
    limit: int = 30,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    uid = uuid.UUID(user["user_id"])
    jobs = list_fix_jobs_for_user(db, uid, limit=max(1, min(limit, 100)))
    return [_row_to_list_item(r) for r in jobs]


@router.post("/fix")
def fix_issue(
    data: FixIssueBody,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    job_id = str(uuid.uuid4())
    user_id = uuid.UUID(user["user_id"])
    create_job(job_id)
    try:
        create_fix_job(
            db,
            job_id=job_id,
            user_id=user_id,
            repo_url=data.repo_url,
            issue_title=data.issue,
            issue_id=data.issue_id,
            repo_label=data.repo_label,
        )
    except Exception:
        try:
            redis_conn.delete(job_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=500, detail="Could not create job record"
        ) from None

    queue.enqueue(
        run_job,
        {
            "job_id": job_id,
            "repo_url": data.repo_url,
            "issue": data.issue,
            "github_token": user["github_token"],
        },
    )

    return {
        "job_id": job_id,
        "status": "queued",
    }
