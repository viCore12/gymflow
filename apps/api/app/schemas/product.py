import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductCreate(BaseModel):
    sku: str
    name: str
    price: Decimal
    stock: int = 0
    active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    name: str
    price: Decimal
    stock: int
    active: bool
