from fastapi.responses import RedirectResponse
import httpx
from fastapi import APIRouter
import os
from dotenv import load_dotenv
from jose import jwt
load_dotenv()


router = APIRouter()

CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET")


@router.get("/auth/github/login")
def github_login():
    url = f"https://github.com/login/oauth/authorize?client_id={CLIENT_ID}&scope=repo user"
    return RedirectResponse(url)


# github callback
@router.get("/auth/github/callback")
async def github_callback(code: str):

    # STEP A: Exchange code → access_token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code": code,
            },
        )

    token_data = token_res.json()
    access_token = token_data.get("access_token")

    # STEP B: Get user info
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )

    user = user_res.json()

    # STEP C: Create JWT
    payload = {
        "user_id": user["id"],
        "username": user["login"],
        "github_token": access_token
    }

    jwt_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    # STEP D: Redirect to frontend
    return RedirectResponse(f"http://localhost:3000/dashboard?token={jwt_token}")




