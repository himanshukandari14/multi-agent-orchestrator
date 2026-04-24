from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.services.fix_job_db import get_fix_job_for_user
from app.store.job_store import job_result, job_status
from app.utils.job_tracker import get_job

router = APIRouter()


@router.get("/jobs/{job_id}")
def get_status(
    job_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    uid = uuid.UUID(user["user_id"])
    row = get_fix_job_for_user(db, job_id, uid)
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")

    live = get_job(job_id)
    if live is not None:
        return {
            "status": live.get("status", "unknown"),
            "result": live.get("result"),
            "progress": live.get("progress", 0),
            "message": live.get("message", ""),
        }

    return {
        "status": row.status,
        "result": row.result,
        "progress": row.progress,
        "message": row.message or "",
    }
