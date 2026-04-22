import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.customer_contact import CustomerContact


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index(
            "ix_customers_phone",
            "phone",
            unique=True,
            postgresql_where="phone IS NOT NULL",
        ),
        Index(
            "ix_customers_full_name_pattern",
            "full_name",
            postgresql_using="btree",
            postgresql_ops={"full_name": "varchar_pattern_ops"},
        ),
        Index(
            "ix_customers_code_pattern",
            "code",
            postgresql_using="btree",
            postgresql_ops={"code": "varchar_pattern_ops"},
        ),
    )

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(
        Enum(Gender, name="gender"), nullable=True
    )
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    contacts: Mapped[list["CustomerContact"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan", lazy="selectin"
    )
