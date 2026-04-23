from rq import SimpleWorker
from redis import Redis

redis_conn = Redis(host="localhost", port=6379)

worker = SimpleWorker(["default"], connection=redis_conn)

worker.work()