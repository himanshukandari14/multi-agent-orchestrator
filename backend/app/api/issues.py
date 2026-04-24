import httpx
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/repos/{owner}/{repo}/issues")
async def get_issues(owner: str, repo: str, user=Depends(get_current_user)):
    token = user["github_token"]

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            headers={"Authorization": f"Bearer {token}"}
        )

    return res.json()