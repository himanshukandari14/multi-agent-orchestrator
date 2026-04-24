from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Plan, PlanSlug, User
from app.services.dodo_client import get_dodo_client


def create_checkout_for_plan(
    db: Session, user: User, plan_slug: str
) -> dict[str, Any]:
    if plan_slug in (PlanSlug.free.value, "free"):
        raise HTTPException(400, "Free plan does not require checkout")
    if plan_slug not in (PlanSlug.pro.value, PlanSlug.pro_plus.value):
        raise HTTPException(400, "Invalid plan")
    plan = db.execute(
        select(Plan).where(Plan.slug == plan_slug)
    ).scalar_one_or_none()
    if not plan or not plan.dodo_product_id:
        raise HTTPException(
            503,
            "This plan is not connected to a Dodo product. Set DODO_PRODUCT_ID_PRO / DODO_PRODUCT_ID_PRO_PLUS.",
        )
    s = get_settings()
    client = get_dodo_client()
    try:
        spec: dict[str, Any] = {
            "product_cart": [{"product_id": plan.dodo_product_id, "quantity": 1}],
            "return_url": f"{s.frontend_url}/billing?checkout=success",
            "cancel_url": f"{s.frontend_url}/billing?checkout=cancel",
            "metadata": {
                "app_user_id": str(user.id),
                "plan_slug": plan.slug,
            },
        }
        if user.email:
            spec["customer"] = {
                "email": user.email,
                "name": user.github_login,
            }
        res = client.checkout_sessions.create(**spec)
    except Exception as e:
        raise HTTPException(502, f"Checkout service error: {e!s}") from e
    if not res.checkout_url:
        raise HTTPException(502, "No checkout_url returned from Dodo")
    return {
        "checkout_url": res.checkout_url,
        "session_id": res.session_id,
        "plan": {"slug": plan.slug, "name": plan.name, "price_cents": plan.price_cents},
    }
