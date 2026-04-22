import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class StockMoveCreate(BaseModel):
    product_id: uuid.UUID
    move_type: str  # in, out, adjustment
    qty: int
    note: str | None = None


class StockMoveApprove(BaseModel):
    approved_by_id: uuid.UUID


class StockMoveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    move_type: str
    qty: int
    status: str
    note: str | None
    created_by_id: uuid.UUID | None
    approved_by_id: uuid.UUID | None
    approved_at: datetime | None
    created_at: datetime


class StockLotCreate(BaseModel):
    product_id: uuid.UUID
    lot_number: str
    qty: int
    expiry_date: date | None = None


class StockLotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    lot_number: str
    qty: int
    expiry_date: date | None


class StockTakeCreate(BaseModel):
    note: str | None = None


class StockTakeLineCreate(BaseModel):
    product_id: uuid.UUID
    system_qty: int
    counted_qty: int


class StockTakeLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stock_take_id: uuid.UUID
    product_id: uuid.UUID
    system_qty: int
    counted_qty: int


class StockTakeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    taken_at: datetime
    status: str
    note: str | None
    created_by_id: uuid.UUID | None
    lines: list[StockTakeLineResponse] = []


class LowStockItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    name: str
    stock: int
