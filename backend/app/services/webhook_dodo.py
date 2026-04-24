"""Process Dodo `unwrap` events — subscription lifecycle + payments + credits."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    CreditEntryType,
    CreditLedger,
    DodoWebhookInbox,
    Payment,
    PaymentStatus,
    Plan,
    Subscription,
    SubscriptionStatus,
    User,
)
from app.services.users import apply_credit_change, get_by_id

__all__ = [
    "apply_webhook_event",
    "dedupe_key_from_unwrapped",
    "process_unwrapped",
    "store_inbox",
]


def _plan_for_product_id(db: Session, product_id: str) -> Plan | None:
    return db.execute(
        select(Plan).where(Plan.dodo_product_id == product_id)
    ).scalar_one_or_none()


def dedupe_key_from_unwrapped(event: object) -> str:
    t = getattr(event, "type", None) or "unknown"
    data = getattr(event, "data", None)
    if data is not None:
        sid = getattr(data, "subscription_id", None)
        if sid:
            return f"{t}:{sid}"
        pid = getattr(data, "payment_id", None)
        if pid:
            return f"{t}:{pid}"
    raw = (
        event.model_dump_json()
        if hasattr(event, "model_dump_json")
        else str(event)
    )
    return f"{t}:{hash(raw) & 0xFFFFFFFF}"


def store_inbox(
    db: Session, event_id: str, event: object, raw_dict: dict[str, Any]
) -> DodoWebhookInbox | None:
    existing = db.execute(
        select(DodoWebhookInbox).where(DodoWebhookInbox.event_id == event_id)
    ).scalar_one_or_none()
    if existing:
        return None
    row = DodoWebhookInbox(
        event_id=event_id,
        event_type=str(getattr(event, "type", None)),
        payload=raw_dict,
        processed=False,
    )
    db.add(row)
    return row


def apply_webhook_event(
    db: Session, event: object, raw_dict: dict[str, Any]
) -> bool:
    """
    Idempotent apply: returns True if a new event was stored and processed,
    False if this `event_id` was already received.
    """
    eid = dedupe_key_from_unwrapped(event)
    row = store_inbox(db, eid, event, raw_dict)
    if row is None:
        return False
    try:
        process_unwrapped(db, event)
    except Exception as err:
        row.error = (str(err) or repr(err))[: 4000]
        raise
    row.processed = True
    return True


def _sync_subscription_row(
    db: Session, user: User, plan: Plan, dsub: Any
) -> Subscription:
    sub = user.subscription
    if sub is None:
        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.active.value,
        )
        db.add(sub)
        db.flush()
    else:
        sub.plan_id = plan.id
        sub.status = SubscriptionStatus.active.value
    sub.dodo_subscription_id = dsub.subscription_id
    sub.current_period_start = dsub.previous_billing_date
    sub.current_period_end = dsub.next_billing_date
    sub.cancel_at_period_end = bool(dsub.cancel_at_next_billing_date)
    if dsub.customer and getattr(dsub.customer, "customer_id", None):
        user.dodo_customer_id = dsub.customer.customer_id
    if getattr(dsub.customer, "email", None) and not user.email:
        user.email = dsub.customer.email
    return sub


def process_unwrapped(db: Session, event: object) -> None:
    t = getattr(event, "type", None)
    if t == "subscription.active":
        dsub = event.data
        plan = _plan_for_product_id(db, dsub.product_id)
        if not plan:
            raise ValueError(
                f"No local Plan for dodo product_id={dsub.product_id}. "
                "Sync DODO_PRODUCT_ID_* and run seed."
            )
        meta = dsub.metadata or {}
        uid = meta.get("app_user_id")
        user: User | None = None
        if uid:
            user = get_by_id(db, uuid.UUID(str(uid)))
        if user is None and dsub.customer:
            user = db.execute(
                select(User).where(
                    User.dodo_customer_id == dsub.customer.customer_id
                )
            ).scalar_one_or_none()
        if not user:
            raise ValueError("User not found for subscription.active")
        _sync_subscription_row(db, user, plan, dsub)
        old = user.credit_balance
        user.credit_balance = plan.monthly_credits
        delta = user.credit_balance - old
        db.add(
            CreditLedger(
                user_id=user.id,
                delta=delta,
                balance_after=user.credit_balance,
                entry_type=CreditEntryType.grant.value,
                reason="Plan credits on subscription active",
                ref_type="dodo",
                ref_id=dsub.subscription_id,
            )
        )
        return
    if t == "subscription.renewed":
        dsub = event.data
        plan = _plan_for_product_id(db, dsub.product_id)
        if not plan:
            return
        sub = db.execute(
            select(Subscription).where(
                Subscription.dodo_subscription_id == dsub.subscription_id
            )
        ).scalar_one_or_none()
        if not sub:
            return
        user = get_by_id(db, sub.user_id)
        if not user:
            return
        apply_credit_change(
            db,
            user,
            plan.monthly_credits,
            CreditEntryType.grant.value,
            reason="Subscription renewed",
            ref_type="dodo",
            ref_id=dsub.subscription_id,
        )
        return
    if t in ("subscription.cancelled", "subscription.expired"):
        dsub = event.data
        sub = db.execute(
            select(Subscription).where(
                Subscription.dodo_subscription_id == dsub.subscription_id
            )
        ).scalar_one_or_none()
        if sub:
            sub.status = (
                SubscriptionStatus.canceled.value
                if t == "subscription.cancelled"
                else SubscriptionStatus.expired.value
            )
        return
    if t == "payment.succeeded":
        p = event.data
        user = None
        if p.metadata and p.metadata.get("app_user_id"):
            user = get_by_id(db, uuid.UUID(p.metadata["app_user_id"]))
        ex = db.execute(
            select(Payment).where(Payment.dodo_payment_id == p.payment_id)
        ).scalar_one_or_none()
        if ex:
            return
        if user:
            db.add(
                Payment(
                    user_id=user.id,
                    dodo_payment_id=p.payment_id,
                    amount_cents=p.total_amount,
                    currency=str(p.currency) if p.currency else "USD",
                    status=PaymentStatus.succeeded.value,
                    dodo_raw=p.model_dump(mode="json"),
                )
            )
        return
    return
