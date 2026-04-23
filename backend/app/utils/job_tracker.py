import json
from app.queue.redis import redis_conn

def create_job(job_id):
    data = {
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None
    }
    redis_conn.set(job_id, json.dumps(data))


def update_job(job_id, **kwargs):
    job = get_job(job_id)
    if not job:
        return

    job.update(kwargs)
    redis_conn.set(job_id, json.dumps(job))


def get_job(job_id):
    data = redis_conn.get(job_id)
    if not data:
        return None
    return json.loads(data)