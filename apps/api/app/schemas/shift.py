from datetime import date as _date, datetime as _datetime, time as _time
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ShiftCreate(BaseModel):
    staff_id: UUID
    date: _date
    start_time: _time
    end_time: _time
    shift_type: str = Field(default="regular", max_length=50)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_times(self) -> "ShiftCreate":
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class ShiftUpdate(BaseModel):
    date: _date | None = None
    start_time: _time | None = None
    end_time: _time | None = None
    shift_type: str | None = Field(None, max_length=50)
    notes: str | None = None
    is_cancelled: bool | None = None

    @model_validator(mode="after")
    def validate_times(self) -> "ShiftUpdate":
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValueError("start_time must be before end_time")
        return self


class ShiftResponse(BaseModel):
    id: UUID
    staff_id: UUID
    staff_full_name: str
    date: _date
    start_time: _time
    end_time: _time
    shift_type: str
    notes: str | None
    is_cancelled: bool
    created_at: _datetime
    updated_at: _datetime

    model_config = {"from_attributes": True}


class ShiftListItem(BaseModel):
    id: UUID
    staff_id: UUID
    staff_full_name: str
    date: _date
    start_time: _time
    end_time: _time
    shift_type: str
    is_cancelled: bool

    model_config = {"from_attributes": True}


class ShiftSearchParams(BaseModel):
    staff_id: UUID | None = None
    date_from: _date | None = None
    date_to: _date | None = None
    shift_type: str | None = None
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
