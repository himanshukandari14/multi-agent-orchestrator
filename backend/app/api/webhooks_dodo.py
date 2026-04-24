from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.dodo_client import get_dodo_client
from app.services.webhook_dodo import apply_webhook_event

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhooks"])


class DodoWebhookResponse(BaseModel):
    """`new_event` is True when the event was stored and processed; False if duplicate idempotency."""

    status: str = Field("ok", description="ok on success")
    new_event: bool


def _dodo_request_extras(
    request: Request, headers: dict[str, str]
) -> dict[str, Any]:
    """Log-safe context: no raw body, no full signing secret or signature value."""
    lower = {k.lower(): v for k, v in headers.items()}
    client_host = request.client.host if request.client else None
    return {
        "client_host": client_host,
        "content_length": headers.get("content-length"),
        "forwarded_for": lower.get("x-forwarded-for"),
        "webhook_id": lower.get("webhook-id", "(missing)"),
        "webhook_timestamp": lower.get("webhook-timestamp", "(missing)"),
        "has_webhook_signature": "webhook-signature" in lower,
    }


@router.post("/webhooks/dodo", response_model=DodoWebhookResponse)
async def dodo_webhook(
    request: Request, db: Session = Depends(get_db)
) -> DodoWebhookResponse:
    body_bytes = await request.body()
    headers = {k: v for k, v in request.headers.items()}
    ctx = _dodo_request_extras(request, headers)

    if not body_bytes:
        logger.warning("dodo webhook rejected: empty body", extra=ctx)
        raise HTTPException(status_code=400, detail="empty body")
    try:
        raw = body_bytes.decode("utf-8")
    except UnicodeDecodeError as e:
        logger.warning(
            "dodo webhook rejected: invalid body encoding: %s",
            e,
            extra={**ctx, "body_len": len(body_bytes)},
        )
        raise HTTPException(
            status_code=400, detail="invalid body encoding"
        ) from e

    json_ok = True
    try:
        raw_dict: dict = json.loads(raw)
    except json.JSONDecodeError as e:
        json_ok = False
        raw_dict = {"_unparsed": raw}
        logger.warning(
            "dodo webhook body is not valid JSON; unwrap may still use raw string: %s",
            e,
            extra={**ctx, "body_len": len(raw)},
        )

    try:
        client = get_dodo_client()
        event = client.webhooks.unwrap(raw, headers=headers)
    except Exception as e:
        logger.exception(
            "dodo webhook verify/unwrap failed",
            extra={
                **ctx,
                "body_len": len(raw),
                "json_parsed": json_ok,
            },
        )
        err_msg = str(e)
        raise HTTPException(
            status_code=400, detail=f"webhook verify failed: {err_msg}"
        ) from e

    event_type = getattr(event, "type", None)
    logger.info(
        "dodo webhook verified: type=%s new_event pending apply",
        event_type,
        extra={**ctx, "event_type": event_type},
    )

    try:
        new_event = apply_webhook_event(db, event, raw_dict)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception(
            "dodo webhook processing failed after verify (type=%s)",
            event_type,
            extra=ctx,
        )
        raise HTTPException(
            status_code=500, detail="webhook processing failed"
        ) from None

    logger.info(
        "dodo webhook handled: type=%s new_event=%s",
        event_type,
        new_event,
        extra=ctx,
    )
    return DodoWebhookResponse(status="ok", new_event=new_event)
