from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import (
    CustomerContactCreate,
    CustomerContactResponse,
    CustomerCreate,
    CustomerListItem,
    CustomerResponse,
    CustomerSearchParams,
    CustomerUpdate,
)
from app.services import customer as svc

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CustomerListItem])
async def list_customers(
    q: str | None = None,
    gender: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    params = CustomerSearchParams(q=q, gender=gender, page=page, per_page=per_page)
    customers, total = await svc.search_customers(db, params)
    return PaginatedResponse(
        items=[CustomerListItem.model_validate(c) for c in customers],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.create_customer(db, data)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.get_customer(db, customer_id)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.update_customer(db, customer_id, data)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    await svc.delete_customer(db, customer_id)


@router.post(
    "/{customer_id}/contacts",
    response_model=CustomerContactResponse,
    status_code=201,
)
async def add_contact(
    customer_id: UUID,
    data: CustomerContactCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return await svc.add_contact(db, customer_id, data)


@router.delete("/contacts/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    await svc.delete_contact(db, contact_id)
