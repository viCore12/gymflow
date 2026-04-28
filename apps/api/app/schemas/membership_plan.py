import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class MembershipPlanCreate(BaseModel):
    code: str
    name: str
    duration_days: int | None = None
    sessions: int | None = None
    price: Decimal
    active: bool = True


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    duration_days: int | None = None
    sessions: int | None = None
    price: Decimal | None = None
    active: bool | None = None


class MembershipPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    duration_days: int | None
    sessions: int | None
    price: Decimal
    active: bool
