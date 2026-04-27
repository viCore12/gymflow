import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.order import Order
from app.models.order_line import OrderLine
from app.models.payment import Payment
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.order import create_order

router = APIRouter()


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    customer_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.lines))
    if customer_id:
        stmt = stmt.where(Order.customer_id == customer_id)
    stmt = stmt.order_by(Order.created_at.desc())
    rows = (await db.execute(stmt)).scalars().unique().all()
    return rows


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Order)
        .options(selectinload(Order.lines))
        .where(Order.id == order_id)
    )
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order_endpoint(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = await create_order(db, data, created_by_id=user.id)
    await db.commit()
    stmt = (
        select(Order)
        .options(selectinload(Order.lines))
        .where(Order.id == order.id)
    )
    order = (await db.execute(stmt)).scalar_one()
    return order


@router.get("/{order_id}/payments", response_model=list[PaymentResponse])
async def list_order_payments(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Payment)
        .where(Payment.order_id == order_id)
        .order_by(Payment.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars().all())


@router.post("/{order_id}/payments", response_model=PaymentResponse, status_code=201)
async def create_payment(
    order_id: uuid.UUID,
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")

    payment = Payment(
        order_id=order_id,
        amount=data.amount,
        method=data.method,
        reference=data.reference,
        note=data.note,
        created_by_id=user.id,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment
