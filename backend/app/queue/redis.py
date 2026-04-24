import os
from dotenv import load_dotenv
from redis import Redis
from rq import Queue
load_dotenv()

# Set REDIS_URL in production (e.g. redis://... or rediss://... from Upstash/Render).
_default = "redis://127.0.0.1:6379/0"
redis_conn = Redis.from_url(os.getenv("REDIS_URL", _default))

queue = Queue("default", connection=redis_conn)