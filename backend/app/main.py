from fastapi import FastAPI
from app.api.jobs import router as job_router

app = FastAPI()

app.include_router(job_router)

@app.get("/")
def root():
    return {"message": "AI SaaS Backend Running"}