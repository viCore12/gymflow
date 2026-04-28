import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.stock_lot import StockLot
from app.models.stock_move import StockMove
from app.models.stock_take import StockTake
from app.models.stock_take_line import StockTakeLine
from app.schemas.inventory import (
    StockLotCreate,
    StockMoveCreate,
    StockTakeCreate,
    StockTakeLineCreate,
)


async def create_stock_move(
    db: AsyncSession,
    data: StockMoveCreate,
    created_by_id: uuid.UUID | None = None,
) -> StockMove:
    move = StockMove(
        product_id=data.product_id,
        move_type=data.move_type,
        qty=data.qty,
        status="draft",
        note=data.note,
        created_by_id=created_by_id,
    )
    db.add(move)
    await db.flush()
    return move


async def approve_stock_move(
    db: AsyncSession,
    move_id: uuid.UUID,
    approved_by_id: uuid.UUID,
) -> StockMove:
    move = await db.get(StockMove, move_id)
    if not move:
        raise ValueError("Stock move not found")
    if move.status != "draft":
        raise ValueError(f"Cannot approve move in status '{move.status}'")

    move.status = "approved"
    move.approved_by_id = approved_by_id
    move.approved_at = datetime.now(timezone.utc)

    product = await db.get(Product, move.product_id)
    if product:
        if move.move_type == "in":
            product.stock += move.qty
        elif move.move_type == "out":
            product.stock -= move.qty
        elif move.move_type == "adjustment":
            product.stock += move.qty  # qty can be negative

    await db.flush()
    return move


async def reject_stock_move(
    db: AsyncSession,
    move_id: uuid.UUID,
    approved_by_id: uuid.UUID,
) -> StockMove:
    move = await db.get(StockMove, move_id)
    if not move:
        raise ValueError("Stock move not found")
    if move.status != "draft":
        raise ValueError(f"Cannot reject move in status '{move.status}'")

    move.status = "rejected"
    move.approved_by_id = approved_by_id
    move.approved_at = datetime.now(timezone.utc)
    await db.flush()
    return move


async def create_stock_lot(
    db: AsyncSession,
    data: StockLotCreate,
) -> StockLot:
    lot = StockLot(
        product_id=data.product_id,
        lot_number=data.lot_number,
        qty=data.qty,
        expiry_date=data.expiry_date,
    )
    db.add(lot)
    await db.flush()
    return lot


async def create_stock_take(
    db: AsyncSession,
    data: StockTakeCreate,
    created_by_id: uuid.UUID | None = None,
) -> StockTake:
    take = StockTake(
        note=data.note,
        created_by_id=created_by_id,
    )
    db.add(take)
    await db.flush()
    return take


async def add_stock_take_line(
    db: AsyncSession,
    stock_take_id: uuid.UUID,
    data: StockTakeLineCreate,
) -> StockTakeLine:
    line = StockTakeLine(
        stock_take_id=stock_take_id,
        product_id=data.product_id,
        system_qty=data.system_qty,
        counted_qty=data.counted_qty,
    )
    db.add(line)
    await db.flush()
    return line


async def close_stock_take(
    db: AsyncSession,
    stock_take_id: uuid.UUID,
    approved_by_id: uuid.UUID,
) -> StockTake:
    """Confirm a stock take and create adjustment moves for discrepancies."""
    take = await db.get(StockTake, stock_take_id)
    if not take:
        raise ValueError("Stock take not found")
    if take.status != "draft":
        raise ValueError("Stock take already confirmed")

    stmt = select(StockTakeLine).where(StockTakeLine.stock_take_id == stock_take_id)
    lines = (await db.execute(stmt)).scalars().all()

    for line in lines:
        diff = line.counted_qty - line.system_qty
        if diff != 0:
            adj = StockMove(
                product_id=line.product_id,
                move_type="adjustment",
                qty=diff,
                status="approved",
                note=f"Stock take adjustment",
                approved_by_id=approved_by_id,
                approved_at=datetime.now(timezone.utc),
            )
            db.add(adj)
            product = await db.get(Product, line.product_id)
            if product:
                product.stock += diff

    take.status = "confirmed"
    await db.flush()
    return take


async def get_low_stock(
    db: AsyncSession,
    threshold: int = 10,
) -> list[Product]:
    stmt = (
        select(Product)
        .where(Product.active == True, Product.stock <= threshold)  # noqa: E712
        .order_by(Product.stock.asc())
    )
    return list((await db.execute(stmt)).scalars().all())
