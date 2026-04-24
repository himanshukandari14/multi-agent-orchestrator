from fastapi import FastAPI
from app.api.routes import router as job_router
from app.api.status import router as status_router
from app.api.auth import router as auth_router
from app.api.repos import router as repo_router
from app.api.issues import router as issues_router
from app.api.fix import router as fix_router
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev (later restrict)
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

@app.get("/")
def root():
    return {"message": "AI SaaS Backend Runssning"}