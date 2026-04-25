from __future__ import annotations

from typing import Any
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.queue.redis import redis_conn


from app.api.deps import get_billing_user
from app.db.models import Plan, Subscription, User
from app.db.session import get_db
from app.services.billing_checkout import create_checkout_for_plan

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutBody(BaseModel):
    plan_slug: str = Field(
        ...,
        description="pro or pro_plus",
        examples=["pro", "pro_plus"],
    )


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)) -> dict[str, Any]:
    cache_key = "billing:plans"

    # cache hit
    cached = redis_conn.get(cache_key)
    if cached:
        print("cached hit: plans")
        return json.loads(cached)
    rows = (
        db.execute(
            select(Plan)
            .where(Plan.is_active.is_(True))
            .order_by(Plan.sort_order)
        )
        .scalars()
        .all()
    )
    data = {
        "plans": [
            {
                "slug": p.slug,
                "name": p.name,
                "description": p.description,
                "monthly_credits": p.monthly_credits,
                "price_cents": p.price_cents,
                "currency": p.currency,
            }
            for p in rows
        ]
    }

    redis_conn.setex(cache_key, 300, json.dumps(data))

    return data


@router.get("/me")
def billing_me(
    db: Session = Depends(get_db),
    user: User = Depends(get_billing_user),
) -> dict[str, Any]:
    cache_key = f"billing:me:{user.id}"

    # CACHE HIT
    cached = redis_conn.get(cache_key)
    if cached:
        print("⚡ CACHE HIT: billing_me")
        return json.loads(cached)
    row = (
        db.execute(
            select(User)
            .where(User.id == user.id)
            .options(
                joinedload(User.subscription).joinedload(Subscription.plan)
            )
        )
        .unique()
        .scalar_one_or_none()
    )
    if not row:
        raise HTTPException(status_code=404, detail="user not found")
    sub = row.subscription
    plan = sub.plan if sub else None
    data = {
        "user": {
            "id": str(row.id),
            "github_login": row.github_login,
            "email": row.email,
            "credit_balance": row.credit_balance,
            "dodo_customer_id": row.dodo_customer_id,
        },
        "subscription": (
            None
            if not sub
            else {
                "status": sub.status,
                "plan": (
                    {
                        "slug": plan.slug,
                        "name": plan.name,
                        "monthly_credits": plan.monthly_credits,
                    }
                    if plan
                    else None
                ),
                "dodo_subscription_id": sub.dodo_subscription_id,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            }
        ),
    }

    # STORE (TTL = 60 sec)
    redis_conn.setex(cache_key, 60, json.dumps(data, default=str))

    return data


@router.post("/checkout")
def start_checkout(
    body: CheckoutBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_billing_user),
) -> dict[str, Any]:
    return create_checkout_for_plan(db, user, body.plan_slug)
