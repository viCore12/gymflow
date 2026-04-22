import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    code: str
    full_name: str
    phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    notes: str | None = None


class CustomerUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    full_name: str
    phone: str | None
    dob: date | None
    gender: str | None
    address: str | None
    notes: str | None
