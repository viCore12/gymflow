import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()


@router.get("", response_model=list[CustomerResponse])
async def list_customers(
    q: str | None = Query(None, min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Customer)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            Customer.full_name.ilike(pattern)
            | Customer.code.ilike(pattern)
            | Customer.phone.ilike(pattern)
        )
    stmt = stmt.order_by(Customer.full_name)
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    await db.commit()
    await db.refresh(customer)
    return customer
