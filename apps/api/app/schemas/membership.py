import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MembershipCreate(BaseModel):
    customer_id: uuid.UUID
    plan_id: uuid.UUID
    start_at: datetime | None = None


class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    plan_id: uuid.UUID
    start_at: datetime
    end_at: datetime | None
    sessions_left: int | None
    active: bool
    notes: str | None


class CheckInCreate(BaseModel):
    customer_id: uuid.UUID
    membership_id: uuid.UUID | None = None


class CheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    membership_id: uuid.UUID
    checked_in_at: datetime
