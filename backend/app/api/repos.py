import httpx
from fastapi import APIRouter
from fastapi import Depends
import json
from app.queue.redis import redis_conn
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/repos")
async def get_repos(user=Depends(get_current_user)):
    token = user["github_token"]
    username = user["username"]

    cache_key = f"repos:{username}"


    # check cachee
    cached = redis_conn.get(cache_key)
    if cached:
        print("cache hit")
        return json.loads(cached)
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/user/repos?per_page=100&sort=updated&type=owner",
            headers={"Authorization": f"Bearer {token}"}
        )
    data =  res.json()

    # set cache
    redis_conn.setex(cache_key, 60, json.dumps(data))

    return data


