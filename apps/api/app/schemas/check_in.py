from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CheckInCreate(BaseModel):
    customer_id: UUID
    notes: str | None = None


class CheckInResponse(BaseModel):
    id: UUID
    customer_id: UUID
    checked_in_at: datetime
    checked_in_by: UUID | None
    method: str
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckInListParams(BaseModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
