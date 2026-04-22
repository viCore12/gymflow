import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.order_line import OrderLine
from app.models.product import Product
from app.models.stock_move import StockMove
from app.schemas.order import OrderCreate
from app.services.membership import create_membership


async def _next_order_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(Order.id)))
    seq = (result.scalar() or 0) + 1
    return f"ORD-{seq:06d}"


async def create_order(
    db: AsyncSession,
    data: OrderCreate,
    created_by_id: uuid.UUID | None = None,
) -> Order:
    order = Order(
        order_number=await _next_order_number(db),
        customer_id=data.customer_id,
        note=data.note,
        status="confirmed",
    )
    db.add(order)
    await db.flush()

    total = 0
    for line_data in data.lines:
        line_total = line_data.unit_price * line_data.qty
        line = OrderLine(
            order_id=order.id,
            product_id=line_data.product_id,
            plan_id=line_data.plan_id,
            description=line_data.description,
            qty=line_data.qty,
            unit_price=line_data.unit_price,
            line_total=line_total,
        )
        db.add(line)
        total += line_total

        # Auto-create membership when a plan line is sold
        if line_data.plan_id and data.customer_id:
            await create_membership(
                db,
                customer_id=data.customer_id,
                plan_id=line_data.plan_id,
            )

        # Auto-deduct stock when a product line is sold
        if line_data.product_id:
            product = await db.get(Product, line_data.product_id)
            if product:
                product.stock -= line_data.qty
                move = StockMove(
                    product_id=line_data.product_id,
                    move_type="out",
                    qty=line_data.qty,
                    status="approved",
                    note=f"Auto: order {order.order_number}",
                    created_by_id=created_by_id,
                    approved_by_id=created_by_id,
                    approved_at=datetime.now(timezone.utc),
                )
                db.add(move)

    order.total = total
    await db.flush()
    return order
