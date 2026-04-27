import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaymentCreate(BaseModel):
    amount: float
    method: str  # cash, bank_transfer, card, ewallet, other
    reference: str | None = None
    note: str | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    amount: float
    method: str
    status: str
    reference: str | None
    note: str | None
    paid_at: datetime | None
    created_by_id: uuid.UUID | None
    created_at: datetime
