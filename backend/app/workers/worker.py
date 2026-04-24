from rq import SimpleWorker

from app.queue.redis import redis_conn

worker = SimpleWorker(["default"], connection=redis_conn)

if __name__ == "__main__":
    worker.work()