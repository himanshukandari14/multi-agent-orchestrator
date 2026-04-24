from fastapi import APIRouter
from app.store.job_store import job_status, job_result
from app.utils.job_tracker import get_job

router = APIRouter()

@router.get("/jobs/{job_id}")
def get_status(job_id: str):
    job = get_job(job_id)
    if job is not None:
        return {
            "status": job.get("status", "unknown"),
            "result": job.get("result"),
            "progress": job.get("progress", 0),
            "message": job.get("message", ""),
        }
    return {
        "status": job_status.get(job_id, "unknown"),
        "result": job_result.get(job_id)
    }