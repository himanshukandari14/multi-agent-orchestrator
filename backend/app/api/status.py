from fastapi import APIRouter
from app.utils.job_tracker import get_job

router = APIRouter()


@router.get("/jobs/{job_id}")
def get_status(job_id: str):
    return get_job(job_id)