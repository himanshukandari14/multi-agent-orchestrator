from fastapi import FastAPI
from app.api.routes import router as job_router
from app.api.status import router as status_router

app = FastAPI()

app.include_router(job_router)
app.include_router(status_router)