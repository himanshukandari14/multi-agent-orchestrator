from fastapi import APIRouter
from app.store.job_store import job_status, job_result

router = APIRouter()

@router.get("/jobs/{job_id}")
def get_status(job_id: str):
    return {
        "status": job_status.get(job_id, "unknown"),
        "result": job_result.get(job_id)
    }