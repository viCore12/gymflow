from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.shift import (
    ShiftCreate,
    ShiftListItem,
    ShiftResponse,
    ShiftSearchParams,
    ShiftUpdate,
)
from app.services import shift as svc

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ShiftListItem])
async def list_shifts(
    staff_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    shift_type: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    params = ShiftSearchParams(
        staff_id=staff_id,
        date_from=date_from,
        date_to=date_to,
        shift_type=shift_type,
        page=page,
        per_page=per_page,
    )
    shifts, total = await svc.list_shifts(db, params)
    return PaginatedResponse(
        items=[ShiftListItem.model_validate(s) for s in shifts],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=ShiftResponse, status_code=201)
async def create_shift(
    data: ShiftCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.create_shift(db, data)


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.get_shift(db, shift_id)


@router.patch("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: UUID,
    data: ShiftUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.update_shift(db, shift_id, data)


@router.delete("/{shift_id}", status_code=204)
async def delete_shift(
    shift_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    await svc.delete_shift(db, shift_id)
