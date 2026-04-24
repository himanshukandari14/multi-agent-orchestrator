from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.billing import router as billing_router
from app.api.fix import router as fix_router
from app.api.issues import router as issues_router
from app.api.repos import router as repo_router
from app.api.routes import router as job_router
from app.api.status import router as status_router
from app.api.webhooks_dodo import router as webhooks_dodo_router
from app.db.init_db import create_tables
from app.db.seed import ensure_plans
from app.db.session import SessionLocal


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_tables()
    db = SessionLocal()
    try:
        ensure_plans(db)
    finally:
        db.close()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_router)
app.include_router(auth_router)
app.include_router(status_router)
app.include_router(repo_router)
app.include_router(issues_router)
app.include_router(fix_router)
app.include_router(billing_router)
app.include_router(webhooks_dodo_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "multi-agent-orchestrator API"}
