from __future__ import annotations

import uuid
from typing import Any

from fastapi import Depends, Header, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import User
from app.db.session import get_db
from app.services.users import get_by_id


def get_billing_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        token = authorization.split(" ", 1)[1]
        payload: dict[str, Any] = jwt.decode(
            token,
            get_settings().jwt_secret,
            algorithms=["HS256"],
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token") from None
    uid = payload.get("user_id")
    if not uid:
        raise HTTPException(
            status_code=401, detail="Token missing user_id; sign in again"
        )
    try:
        u = uuid.UUID(str(uid))
    except ValueError as e:
        raise HTTPException(
            status_code=401, detail="Invalid user_id in token"
        ) from e
    user = get_by_id(db, u)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
