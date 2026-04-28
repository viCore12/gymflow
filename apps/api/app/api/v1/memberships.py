import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.membership import Membership
from app.models.user import User
from app.schemas.membership import (
    CheckInCreate,
    CheckInResponse,
    MembershipCreate,
    MembershipResponse,
)
from app.services.membership import check_in, create_membership

router = APIRouter()


@router.get("", response_model=list[MembershipResponse])
async def list_memberships(
    customer_id: uuid.UUID | None = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Membership)
    if customer_id:
        stmt = stmt.where(Membership.customer_id == customer_id)
    if active_only:
        stmt = stmt.where(Membership.active == True)  # noqa: E712
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.post("", response_model=MembershipResponse, status_code=201)
async def create_membership_endpoint(
    data: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        membership = await create_membership(
            db, data.customer_id, data.plan_id, data.start_at
        )
        await db.commit()
        await db.refresh(membership)
        return membership
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/check-in", response_model=CheckInResponse, status_code=201)
async def check_in_endpoint(
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        record = await check_in(db, data.customer_id, data.membership_id)
        await db.commit()
        await db.refresh(record)
        return record
    except ValueError as e:
        raise HTTPException(400, str(e))
