from datetime import date as date_type
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceListItem,
    AttendanceManualAdjust,
    AttendanceResponse,
    AttendanceSearchParams,
)
from app.schemas.common import PaginatedResponse
from app.services import attendance as svc

router = APIRouter()


@router.post("/check-in", response_model=AttendanceResponse, status_code=201)
async def check_in(
    data: AttendanceCheckIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.check_in(db, data, current_user)


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    data: AttendanceCheckOut,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.check_out(db, data, current_user)


@router.post("/manual-adjust", response_model=AttendanceResponse)
async def manual_adjust(
    data: AttendanceManualAdjust,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await svc.manual_adjust(db, data, current_user)


@router.get("", response_model=PaginatedResponse[AttendanceListItem])
async def list_attendance(
    staff_id: UUID | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    params = AttendanceSearchParams(
        staff_id=staff_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )
    records, total = await svc.list_attendance(db, params)
    return PaginatedResponse(
        items=[AttendanceListItem.model_validate(r) for r in records],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.get_attendance(db, attendance_id)
