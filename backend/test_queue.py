from app.queue.redis import queue
from app.services.job_runner import run_job

job = queue.enqueue(run_job, {
    "repo_url": "https://github.com/himanshukandari14/himanshukandari14.git",
    "issue": "create a new file - himanshu.js and write a hello world function in it"
})

print("Job sent:", job.id)