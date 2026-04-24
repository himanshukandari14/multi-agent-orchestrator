from app.services.job_runner import run_job
from app.queue.redis import queue
from app.core.auth import get_current_user
from app.utils.job_tracker import create_job
from fastapi import Depends
from fastapi import APIRouter
import uuid
router = APIRouter()

@router.post("/fix")
def fix_issue(data: dict, user=Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    create_job(job_id)

    queue.enqueue(run_job, {
        "job_id": job_id,
        "repo_url": data["repo_url"],
        "issue": data["issue"],
        "github_token": user["github_token"]
    })

    return {
        "job_id": job_id,
        "status": "queued"
    }


