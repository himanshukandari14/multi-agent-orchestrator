from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    CreditEntryType,
    CreditLedger,
    Plan,
    PlanSlug,
    Subscription,
    SubscriptionStatus,
    User,
)


def get_by_github_id(db: Session, github_id: int) -> User | None:
    return db.execute(select(User).where(User.github_id == github_id)).scalar_one_or_none()


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_or_create_user_from_github(
    db: Session, github_id: int, login: str, email: str | None
) -> User:
    user = get_by_github_id(db, github_id)
    if user:
        user.github_login = login
        if email:
            user.email = email
        db.commit()
        db.refresh(user)
        return user

    free = db.execute(
        select(Plan).where(Plan.slug == PlanSlug.free.value)
    ).scalar_one()
    user = User(
        github_id=github_id,
        github_login=login,
        email=email,
        credit_balance=free.monthly_credits,
    )
    db.add(user)
    db.flush()
    sub = Subscription(
        user_id=user.id,
        plan_id=free.id,
        status=SubscriptionStatus.active.value,
    )
    db.add(sub)
    db.add(
        CreditLedger(
            user_id=user.id,
            delta=free.monthly_credits,
            balance_after=free.monthly_credits,
            entry_type=CreditEntryType.grant.value,
            reason="Free plan initial credits",
            ref_type="signup",
        )
    )
    db.commit()
    db.refresh(user)
    return user


def apply_credit_change(
    db: Session,
    user: User,
    delta: int,
    entry_type: str,
    *,
    reason: str | None = None,
    ref_type: str | None = None,
    ref_id: str | None = None,
    meta: dict[str, Any] | None = None,
) -> User:
    user.credit_balance = max(0, user.credit_balance + delta)
    db.add(
        CreditLedger(
            user_id=user.id,
            delta=delta,
            balance_after=user.credit_balance,
            entry_type=entry_type,  # already .value
            reason=reason,
            ref_type=ref_type,
            ref_id=ref_id,
            meta=meta,
        )
    )
    return user
