import uuid
from datetime import date, datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AppError
from app.models.attendance import Attendance
from app.models.attendance_audit import AttendanceAudit
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceManualAdjust,
    AttendanceSearchParams,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _log_audit(
    db: AsyncSession,
    attendance_id: uuid.UUID,
    action: str,
    user: User,
    field_changed: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
) -> AttendanceAudit:
    entry = AttendanceAudit(
        attendance_id=attendance_id,
        action=action,
        field_changed=field_changed,
        old_value=old_value,
        new_value=new_value,
        changed_by_user_id=user.id,
        changed_at=_now(),
    )
    db.add(entry)
    return entry


async def check_in(
    db: AsyncSession, data: AttendanceCheckIn, current_user: User
) -> Attendance:
    today = date.today()
    existing = await db.execute(
        select(Attendance).where(
            and_(Attendance.staff_id == data.staff_id, Attendance.date == today)
        )
    )
    if existing.scalar_one_or_none():
        raise AppError(409, "Staff member already checked in today")

    now = _now()
    record = Attendance(
        staff_id=data.staff_id,
        date=today,
        check_in=now,
        source="manual",
        notes=data.notes,
    )
    db.add(record)
    await db.flush()

    _log_audit(db, record.id, "check_in", current_user)

    await db.commit()
    await db.refresh(record)
    return record


async def check_out(
    db: AsyncSession, data: AttendanceCheckOut, current_user: User
) -> Attendance:
    today = date.today()
    result = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.staff_id == data.staff_id,
                Attendance.date == today,
                Attendance.check_in.isnot(None),
                Attendance.check_out.is_(None),
            )
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise AppError(400, "No open check-in found for today")

    record.check_out = _now()
    _log_audit(db, record.id, "check_out", current_user)

    await db.commit()
    await db.refresh(record)
    return record


async def manual_adjust(
    db: AsyncSession, data: AttendanceManualAdjust, current_user: User
) -> Attendance:
    result = await db.execute(
        select(Attendance).where(Attendance.id == data.attendance_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise AppError(404, "Attendance record not found")

    update_fields = data.model_dump(
        exclude_unset=True,
        exclude={"attendance_id", "adjustment_reason"},
    )

    for field in ("check_in", "check_out", "notes"):
        if field in update_fields:
            old_val = getattr(record, field)
            new_val = update_fields[field]
            _log_audit(
                db,
                record.id,
                "manual_adjust",
                current_user,
                field_changed=field,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(new_val) if new_val is not None else None,
            )
            setattr(record, field, new_val)

    record.adjusted_by_user_id = current_user.id
    record.adjusted_at = _now()
    record.adjustment_reason = data.adjustment_reason

    await db.commit()
    await db.refresh(record)
    return record


async def list_attendance(
    db: AsyncSession, params: AttendanceSearchParams
) -> tuple[list[Attendance], int]:
    query = select(Attendance)
    count_query = select(func.count()).select_from(Attendance)

    if params.staff_id:
        query = query.where(Attendance.staff_id == params.staff_id)
        count_query = count_query.where(Attendance.staff_id == params.staff_id)

    if params.date_from:
        query = query.where(Attendance.date >= params.date_from)
        count_query = count_query.where(Attendance.date >= params.date_from)

    if params.date_to:
        query = query.where(Attendance.date <= params.date_to)
        count_query = count_query.where(Attendance.date <= params.date_to)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (params.page - 1) * params.per_page
    query = query.order_by(Attendance.date.desc()).offset(offset).limit(params.per_page)
    result = await db.execute(query)
    records = list(result.scalars().all())

    return records, total


async def get_attendance(db: AsyncSession, attendance_id: uuid.UUID) -> Attendance:
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise AppError(404, "Attendance record not found")
    return record
