import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.stock_move import StockMove
from app.models.stock_take import StockTake
from app.models.stock_take_line import StockTakeLine
from app.models.user import User
from app.schemas.inventory import (
    LowStockItem,
    StockLotCreate,
    StockLotResponse,
    StockMoveApprove,
    StockMoveCreate,
    StockMoveResponse,
    StockTakeCreate,
    StockTakeLineCreate,
    StockTakeLineResponse,
    StockTakeResponse,
)
from app.services.inventory import (
    add_stock_take_line,
    approve_stock_move,
    close_stock_take,
    create_stock_lot,
    create_stock_move,
    create_stock_take,
    get_low_stock,
    reject_stock_move,
)

router = APIRouter()


# --- Stock Moves ---

@router.get("/moves", response_model=list[StockMoveResponse])
async def list_moves(
    product_id: uuid.UUID | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StockMove).order_by(StockMove.created_at.desc())
    if product_id:
        stmt = stmt.where(StockMove.product_id == product_id)
    if status:
        stmt = stmt.where(StockMove.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.post("/moves", response_model=StockMoveResponse, status_code=201)
async def create_move(
    data: StockMoveCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    move = await create_stock_move(db, data, created_by_id=user.id)
    await db.commit()
    await db.refresh(move)
    return move


@router.post("/moves/{move_id}/approve", response_model=StockMoveResponse)
async def approve_move(
    move_id: uuid.UUID,
    data: StockMoveApprove,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        move = await approve_stock_move(db, move_id, data.approved_by_id)
        await db.commit()
        await db.refresh(move)
        return move
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/moves/{move_id}/reject", response_model=StockMoveResponse)
async def reject_move(
    move_id: uuid.UUID,
    data: StockMoveApprove,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        move = await reject_stock_move(db, move_id, data.approved_by_id)
        await db.commit()
        await db.refresh(move)
        return move
    except ValueError as e:
        raise HTTPException(400, str(e))


# --- Stock Lots ---

@router.post("/lots", response_model=StockLotResponse, status_code=201)
async def create_lot(
    data: StockLotCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lot = await create_stock_lot(db, data)
    await db.commit()
    await db.refresh(lot)
    return lot


# --- Stock Takes ---

@router.post("/stock-takes", response_model=StockTakeResponse, status_code=201)
async def create_take(
    data: StockTakeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    take = await create_stock_take(db, data, created_by_id=user.id)
    await db.commit()
    stmt = (
        select(StockTake)
        .options(selectinload(StockTake.lines))
        .where(StockTake.id == take.id)
    )
    take = (await db.execute(stmt)).scalar_one()
    return take


@router.post(
    "/stock-takes/{take_id}/lines",
    response_model=StockTakeLineResponse,
    status_code=201,
)
async def add_take_line(
    take_id: uuid.UUID,
    data: StockTakeLineCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    line = await add_stock_take_line(db, take_id, data)
    await db.commit()
    await db.refresh(line)
    return line


@router.post("/stock-takes/{take_id}/close", response_model=StockTakeResponse)
async def close_take(
    take_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        take = await close_stock_take(db, take_id, approved_by_id=user.id)
        await db.commit()
        stmt = (
            select(StockTake)
            .options(selectinload(StockTake.lines))
            .where(StockTake.id == take_id)
        )
        take = (await db.execute(stmt)).scalar_one()
        return take
    except ValueError as e:
        raise HTTPException(400, str(e))


# --- Low Stock ---

@router.get("/low-stock", response_model=list[LowStockItem])
async def low_stock(
    threshold: int = 10,
    db: AsyncSession = Depends(get_db),
):
    products = await get_low_stock(db, threshold)
    return products
