import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.membership_plan import MembershipPlan
from app.models.user import User
from app.schemas.membership_plan import (
    MembershipPlanCreate,
    MembershipPlanResponse,
    MembershipPlanUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MembershipPlanResponse])
async def list_plans(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MembershipPlan)
    if active_only:
        stmt = stmt.where(MembershipPlan.active == True)  # noqa: E712
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.get("/{plan_id}", response_model=MembershipPlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    plan = await db.get(MembershipPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


@router.post("", response_model=MembershipPlanResponse, status_code=201)
async def create_plan(
    data: MembershipPlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = MembershipPlan(**data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.patch("/{plan_id}", response_model=MembershipPlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    data: MembershipPlanUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = await db.get(MembershipPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.commit()
    await db.refresh(plan)
    return plan
