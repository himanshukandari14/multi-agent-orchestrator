from __future__ import annotations

from typing import Any

from fastapi import Header, HTTPException
from jose import jwt

from app.core.config import get_settings


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """Decode JWT from `Authorization: Bearer …` (includes `github_token`, `user_id`)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            get_settings().jwt_secret,
            algorithms=["HS256"],
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token") from None
    return payload
