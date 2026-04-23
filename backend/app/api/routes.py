from fastapi import APIRouter
from pydantic import BaseModel
from rq import Retry
from app.queue.redis import queue
from app.services.job_runner import run_job
from app.utils.job_tracker import create_job

router = APIRouter()


class JobRequest(BaseModel):
    repo_url: str
    issue: str


@router.post("/jobs")
def create_new_job(data: JobRequest):
    job = queue.enqueue(
        run_job,
        {
            "repo_url": data.repo_url,
            "issue": data.issue,
            "job_id": None  # we’ll set next
        },
        retry=Retry(max=3, interval=[10, 30, 60])
    )

    # use RQ job id
    job_id = job.id

    # store job
    create_job(job_id)

    return {
        "job_id": job_id,
        "status": "queued"
    }