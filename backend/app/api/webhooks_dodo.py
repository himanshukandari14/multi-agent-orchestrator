from __future__ import annotations

import json
import traceback

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.dodo_client import get_dodo_client
from app.services.webhook_dodo import apply_webhook_event

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/dodo")
async def dodo_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    body_bytes = await request.body()
    if not body_bytes:
        raise HTTPException(status_code=400, detail="empty body")
    try:
        raw = body_bytes.decode("utf-8")
    except UnicodeDecodeError as e:
        raise HTTPException(
            status_code=400, detail="invalid body encoding"
        ) from e

    try:
        raw_dict: dict = json.loads(raw)
    except json.JSONDecodeError:
        raw_dict = {"_unparsed": raw}

    headers = {k: v for k, v in request.headers.items()}

    try:
        client = get_dodo_client()
        event = client.webhooks.unwrap(raw, headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"webhook verify failed: {e!s}"
        ) from e

    try:
        new_event = apply_webhook_event(db, event, raw_dict)
        db.commit()
    except Exception:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail="webhook processing failed"
        ) from None

    return {"status": "ok", "new_event": new_event}
