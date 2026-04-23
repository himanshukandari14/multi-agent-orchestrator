from fastapi import APIRouter
from rq import retry
from app.queue.redis import queue
from app.services.job_runner import run_job


router = APIRouter()


@router.post("/jobs")
def create_job(data: dict):
    job = queue.enqueue(run_job, data, retry=retry(max=3, interval=[10,30,60]))
    return {"job_id": job.id}