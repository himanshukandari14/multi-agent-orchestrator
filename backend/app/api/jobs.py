from fastapi import APIRouter
from app.queue.redis import queue
from app.services.job_runner import run_job


router = APIRouter()


@router.post("/jobs")
def create_job(data: dict):
    job = queue.enqueue(run_job, data)
    return {"job_id": job.id}