from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.check_in import CheckInCreate, CheckInListParams, CheckInResponse
from app.schemas.common import PaginatedResponse
from app.services import check_in as svc

router = APIRouter()


@router.post("", response_model=CheckInResponse, status_code=201)
async def create_check_in(
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.create_check_in(db, data, user.id)


@router.get(
    "/customer/{customer_id}",
    response_model=PaginatedResponse[CheckInResponse],
)
async def list_customer_checkins(
    customer_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    params = CheckInListParams(page=page, per_page=per_page)
    checkins, total = await svc.list_checkins_for_customer(db, customer_id, params)
    return PaginatedResponse(
        items=[CheckInResponse.model_validate(c) for c in checkins],
        total=total,
        page=page,
        per_page=per_page,
    )
