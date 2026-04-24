import httpx
from fastapi import APIRouter
from fastapi import Depends
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/repos")
async def get_repos(user=Depends(get_current_user)):
    token = user["github_token"]

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/user/repos?per_page=100&sort=updated&type=owner",
            headers={"Authorization": f"Bearer {token}"}
        )
    return res.json()
