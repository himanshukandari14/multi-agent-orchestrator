from __future__ import annotations

import os

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.services.users import get_or_create_user_from_github

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")


@router.get("/auth/github/login")
def github_login() -> RedirectResponse:
    if not CLIENT_ID:
        raise RuntimeError("GITHUB_CLIENT_ID is not set")
    url = (
        "https://github.com/login/oauth/authorize"
        # `repo` alone does not include managing webhooks; `write:repo_hook` is required
        # for POST /repos/{owner}/{repo}/hooks (autoreview toggle).
        f"?client_id={CLIENT_ID}&scope=repo%20user:email%20write:repo_hook"
    )
    return RedirectResponse(url)


@router.get("/auth/github/callback")
async def github_callback(
    code: str,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError("GitHub OAuth env vars are not set")

    settings = get_settings()
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
        if not access_token:
            return RedirectResponse(
                f"{settings.frontend_url}/?error=github_token"
            )

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_res.raise_for_status()
        gh = user_res.json()

    email = gh.get("email")
    if not email:
        async with httpx.AsyncClient() as client:
            em_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if em_res.is_success:
                for row in em_res.json():
                    if row.get("primary") and row.get("email"):
                        email = row["email"]
                        break

    app_user = get_or_create_user_from_github(
        db,
        github_id=int(gh["id"]),
        login=gh["login"],
        email=email,
    )

    payload = {
        "user_id": str(app_user.id),
        "github_id": app_user.github_id,
        "username": app_user.github_login,
        "github_token": access_token,
    }
    jwt_token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    redirect_url = f"{settings.frontend_url.rstrip('/')}/dashboard?token={jwt_token}"
    response = RedirectResponse(redirect_url, status_code=302)
    # Mirror JWT for Next.js middleware (must match `JWT_SECRET` in the client app).
    _secure = str(settings.frontend_url).lower().startswith("https://")
    response.set_cookie(
        key="app_token",
        value=jwt_token,
        max_age=60 * 60 * 24 * 7,
        path="/",
        samesite="lax",
        secure=_secure,
        httponly=False,
    )
    return response
