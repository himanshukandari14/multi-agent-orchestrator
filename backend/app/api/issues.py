import httpx
from fastapi import APIRouter, Depends
import json
from app.core.auth import get_current_user
from app.queue.redis import redis_conn

router = APIRouter()


@router.get("/repos/{owner}/{repo}/issues")
async def get_issues(owner: str, repo: str, user=Depends(get_current_user)):
    token = user["github_token"]
    cache_key = f"issues:{owner}:{repo}"
    
    cached = redis_conn.get(cache_key)
    if cached:
        print("⚡ CACHE HIT: get_issues")
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            headers={"Authorization": f"Bearer {token}"}
        )

    data = res.json()
    redis_conn.setex(cache_key, 60, json.dumps(data))
    return data