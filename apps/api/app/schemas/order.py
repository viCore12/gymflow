import uuid
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderLineCreate(BaseModel):
    product_id: uuid.UUID | None = None
    plan_id: uuid.UUID | None = None
    description: str
    qty: int = 1
    unit_price: Decimal


class OrderCreate(BaseModel):
    customer_id: uuid.UUID | None = None
    note: str | None = None
    lines: list[OrderLineCreate]


class OrderLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID | None
    plan_id: uuid.UUID | None
    description: str
    qty: int
    unit_price: Decimal
    line_total: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID | None
    total: Decimal
    status: str
    note: str | None
    created_at: datetime
    lines: list[OrderLineResponse] = []
