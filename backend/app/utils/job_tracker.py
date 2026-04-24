import json
import logging

from app.queue.redis import redis_conn

logger = logging.getLogger(__name__)


def create_job(job_id):
    data = {
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
    }
    redis_conn.set(job_id, json.dumps(data))


def update_job(job_id, **kwargs):
    job = get_job(job_id)
    if not job:
        return

    job.update(kwargs)
    redis_conn.set(job_id, json.dumps(job))
    try:
        from app.services.fix_job_db import update_fix_job_record

        update_fix_job_record(job_id, **kwargs)
    except Exception:
        logger.exception("fix_job db sync from update_job for %s", job_id)


def get_job(job_id):
    data = redis_conn.get(job_id)
    if not data:
        return None
    return json.loads(data)