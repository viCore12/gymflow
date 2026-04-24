from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AttendanceCheckIn(BaseModel):
    staff_id: UUID
    notes: str | None = None


class AttendanceCheckOut(BaseModel):
    staff_id: UUID


class AttendanceManualAdjust(BaseModel):
    attendance_id: UUID
    check_in: datetime | None = None
    check_out: datetime | None = None
    notes: str | None = None
    adjustment_reason: str = Field(..., min_length=1)


class AttendanceAuditResponse(BaseModel):
    id: UUID
    attendance_id: UUID
    action: str
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    changed_by_user_id: UUID
    changed_at: datetime

    model_config = {"from_attributes": True}


class AttendanceResponse(BaseModel):
    id: UUID
    staff_id: UUID
    staff_full_name: str
    date: date
    check_in: datetime | None
    check_out: datetime | None
    source: str
    notes: str | None
    adjusted_by_user_id: UUID | None
    adjusted_at: datetime | None
    adjustment_reason: str | None
    created_at: datetime
    updated_at: datetime
    audit_entries: list[AttendanceAuditResponse] = []

    model_config = {"from_attributes": True}


class AttendanceListItem(BaseModel):
    id: UUID
    staff_id: UUID
    staff_full_name: str
    date: date
    check_in: datetime | None
    check_out: datetime | None
    source: str
    has_adjustment: bool

    model_config = {"from_attributes": True}


class AttendanceSearchParams(BaseModel):
    staff_id: UUID | None = None
    date_from: date | None = None
    date_to: date | None = None
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
