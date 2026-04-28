import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.check_in import CheckIn
from app.models.membership import Membership
from app.models.membership_plan import MembershipPlan


async def create_membership(
    db: AsyncSession,
    customer_id: uuid.UUID,
    plan_id: uuid.UUID,
    start_at: datetime | None = None,
) -> Membership:
    plan = await db.get(MembershipPlan, plan_id)
    if not plan:
        raise ValueError("Plan not found")

    now = start_at or datetime.now(timezone.utc)

    # Renewal stacking: if customer already has an active membership on the
    # same plan, extend it instead of creating a new row.
    stmt = (
        select(Membership)
        .where(
            Membership.customer_id == customer_id,
            Membership.plan_id == plan_id,
            Membership.active == True,  # noqa: E712
        )
        .limit(1)
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()

    if existing:
        if plan.duration_days and existing.end_at:
            existing.end_at += timedelta(days=plan.duration_days)
        if plan.sessions and existing.sessions_left is not None:
            existing.sessions_left += plan.sessions
        await db.flush()
        return existing

    end_at = now + timedelta(days=plan.duration_days) if plan.duration_days else None
    sessions_left = plan.sessions

    membership = Membership(
        customer_id=customer_id,
        plan_id=plan_id,
        start_at=now,
        end_at=end_at,
        sessions_left=sessions_left,
        active=True,
    )
    db.add(membership)
    await db.flush()
    return membership


async def check_in(
    db: AsyncSession,
    customer_id: uuid.UUID,
    membership_id: uuid.UUID | None = None,
) -> CheckIn:
    if membership_id:
        membership = await db.get(Membership, membership_id)
    else:
        # Auto-select: active membership with earliest end_at (ASC).
        stmt = (
            select(Membership)
            .where(
                Membership.customer_id == customer_id,
                Membership.active == True,  # noqa: E712
            )
            .order_by(Membership.end_at.asc().nullslast())
            .limit(1)
        )
        membership = (await db.execute(stmt)).scalar_one_or_none()

    if not membership or not membership.active:
        raise ValueError("No active membership found")

    if membership.sessions_left is not None:
        if membership.sessions_left <= 0:
            raise ValueError("No sessions remaining")
        membership.sessions_left -= 1
        if membership.sessions_left == 0 and membership.end_at is None:
            membership.active = False

    record = CheckIn(
        customer_id=customer_id,
        membership_id=membership.id,
    )
    db.add(record)
    await db.flush()
    return record
