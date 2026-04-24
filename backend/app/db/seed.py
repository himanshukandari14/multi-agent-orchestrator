"""Idempotent plan catalog + Dodo product id wiring from settings."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Plan, PlanSlug


def ensure_plans(db: Session) -> None:
    settings = get_settings()
    for row in (
        {
            "slug": PlanSlug.free.value,
            "name": "Free",
            "description": "Try fixes with a limited monthly credit pool.",
            "monthly_credits": 100,
            "price_cents": 0,
            "dodo_product_id": None,
            "sort_order": 0,
        },
        {
            "slug": PlanSlug.pro.value,
            "name": "Pro",
            "description": "More credits for regular automation.",
            "monthly_credits": 2_000,
            "price_cents": 2_900,
            "dodo_product_id": settings.dodo_product_id_pro,
            "sort_order": 1,
        },
        {
            "slug": PlanSlug.pro_plus.value,
            "name": "Pro+",
            "description": "Highest credit allowance and priority jobs.",
            "monthly_credits": 10_000,
            "price_cents": 9_900,
            "dodo_product_id": settings.dodo_product_id_pro_plus,
            "sort_order": 2,
        },
    ):
        plan = db.execute(
            select(Plan).where(Plan.slug == row["slug"])
        ).scalar_one_or_none()
        if plan is None:
            db.add(
                Plan(
                    slug=row["slug"],
                    name=row["name"],
                    description=row["description"],
                    monthly_credits=row["monthly_credits"],
                    price_cents=row["price_cents"],
                    dodo_product_id=row["dodo_product_id"],
                    sort_order=row["sort_order"],
                )
            )
        else:
            plan.name = row["name"]
            plan.description = row["description"]
            plan.monthly_credits = row["monthly_credits"]
            plan.price_cents = row["price_cents"]
            plan.sort_order = row["sort_order"]
            if row["dodo_product_id"]:
                plan.dodo_product_id = row["dodo_product_id"]
    db.commit()
