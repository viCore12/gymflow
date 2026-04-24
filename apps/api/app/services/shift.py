import uuid
from datetime import date

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AppError
from app.models.shift import Shift
from app.models.staff import Staff
from app.schemas.shift import ShiftCreate, ShiftSearchParams, ShiftUpdate


async def _assert_staff_exists(db: AsyncSession, staff_id: uuid.UUID) -> None:
    result = await db.execute(select(Staff.id).where(Staff.id == staff_id))
    if result.scalar_one_or_none() is None:
        raise AppError(404, "Staff not found")


async def _check_overlap(
    db: AsyncSession,
    staff_id: uuid.UUID,
    shift_date: date,
    start_time,
    end_time,
    exclude_shift_id: uuid.UUID | None = None,
) -> None:
    query = select(Shift.id).where(
        Shift.staff_id == staff_id,
        Shift.date == shift_date,
        Shift.is_cancelled.is_(False),
        Shift.start_time < end_time,
        Shift.end_time > start_time,
    )
    if exclude_shift_id is not None:
        query = query.where(Shift.id != exclude_shift_id)
    result = await db.execute(query)
    if result.scalar_one_or_none() is not None:
        raise AppError(409, "Shift overlaps with an existing shift for this staff member")


async def create_shift(db: AsyncSession, data: ShiftCreate) -> Shift:
    await _assert_staff_exists(db, data.staff_id)
    await _check_overlap(db, data.staff_id, data.date, data.start_time, data.end_time)

    shift = Shift(
        staff_id=data.staff_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        shift_type=data.shift_type,
        notes=data.notes,
    )
    db.add(shift)
    await db.commit()
    await db.refresh(shift)
    return shift


async def get_shift(db: AsyncSession, shift_id: uuid.UUID) -> Shift:
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    shift = result.scalar_one_or_none()
    if not shift:
        raise AppError(404, "Shift not found")
    return shift


async def update_shift(
    db: AsyncSession, shift_id: uuid.UUID, data: ShiftUpdate
) -> Shift:
    shift = await get_shift(db, shift_id)
    update_data = data.model_dump(exclude_unset=True)

    new_date = update_data.get("date", shift.date)
    new_start = update_data.get("start_time", shift.start_time)
    new_end = update_data.get("end_time", shift.end_time)

    if any(k in update_data for k in ("date", "start_time", "end_time")):
        await _check_overlap(db, shift.staff_id, new_date, new_start, new_end, exclude_shift_id=shift_id)

    for field, value in update_data.items():
        setattr(shift, field, value)

    await db.commit()
    await db.refresh(shift)
    return shift


async def delete_shift(db: AsyncSession, shift_id: uuid.UUID) -> None:
    shift = await get_shift(db, shift_id)
    shift.is_cancelled = True
    await db.commit()


async def list_shifts(
    db: AsyncSession, params: ShiftSearchParams
) -> tuple[list[Shift], int]:
    query = select(Shift)
    count_query = select(func.count()).select_from(Shift)

    filters = []
    if params.staff_id is not None:
        filters.append(Shift.staff_id == params.staff_id)
    if params.date_from is not None:
        filters.append(Shift.date >= params.date_from)
    if params.date_to is not None:
        filters.append(Shift.date <= params.date_to)
    if params.shift_type is not None:
        filters.append(Shift.shift_type == params.shift_type)

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    total = (await db.execute(count_query)).scalar_one()

    offset = (params.page - 1) * params.per_page
    query = query.order_by(Shift.date.desc(), Shift.start_time.asc()).offset(offset).limit(params.per_page)
    shifts = list((await db.execute(query)).scalars().all())

    return shifts, total
