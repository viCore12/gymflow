from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CustomerContactCreate(BaseModel):
    contact_type: str = Field(..., pattern="^(phone|email|emergency)$")
    value: str = Field(..., max_length=255)
    label: str | None = Field(None, max_length=100)
    is_primary: bool = False
    notes: str | None = None


class CustomerContactResponse(BaseModel):
    id: UUID
    contact_type: str
    value: str
    label: str | None
    is_primary: bool
    notes: str | None

    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)
    dob: date | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    address: str | None = None
    notes: str | None = None
    branch_id: UUID | None = None
    contacts: list[CustomerContactCreate] = []


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)
    dob: date | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    is_active: bool | None = None
    address: str | None = None
    notes: str | None = None
    branch_id: UUID | None = None


class CustomerResponse(BaseModel):
    id: UUID
    code: str
    full_name: str
    phone: str | None
    dob: date | None
    gender: str | None
    is_active: bool
    address: str | None
    notes: str | None
    branch_id: UUID | None
    created_at: datetime
    updated_at: datetime
    contacts: list[CustomerContactResponse] = []

    model_config = {"from_attributes": True}


class CustomerListItem(BaseModel):
    id: UUID
    code: str
    full_name: str
    phone: str | None
    dob: date | None
    gender: str | None
    is_active: bool
    email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerSearchParams(BaseModel):
    q: str | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
