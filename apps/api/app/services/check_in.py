import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AppError
from app.models.check_in import CheckIn
from app.models.customer import Customer
from app.schemas.check_in import CheckInCreate, CheckInListParams


async def create_check_in(
    db: AsyncSession, data: CheckInCreate, staff_user_id: uuid.UUID
) -> CheckIn:
    result = await db.execute(
        select(Customer).where(Customer.id == data.customer_id)
    )
    if not result.scalar_one_or_none():
        raise AppError(404, "Customer not found")

    check_in = CheckIn(
        customer_id=data.customer_id,
        checked_in_at=datetime.now(timezone.utc),
        checked_in_by=staff_user_id,
        method="manual",
        notes=data.notes,
    )
    db.add(check_in)
    await db.commit()
    await db.refresh(check_in)
    return check_in


async def list_checkins_for_customer(
    db: AsyncSession, customer_id: uuid.UUID, params: CheckInListParams
) -> tuple[list[CheckIn], int]:
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    if not result.scalar_one_or_none():
        raise AppError(404, "Customer not found")

    count_query = (
        select(func.count())
        .select_from(CheckIn)
        .where(CheckIn.customer_id == customer_id)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (params.page - 1) * params.per_page
    query = (
        select(CheckIn)
        .where(CheckIn.customer_id == customer_id)
        .order_by(CheckIn.checked_in_at.desc())
        .offset(offset)
        .limit(params.per_page)
    )
    result = await db.execute(query)
    checkins = list(result.scalars().all())

    return checkins, total
