import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.pt_session import PtSession
    from app.models.shift import Shift


class Staff(Base):
    __tablename__ = "staff"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), unique=True
    )
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(100))
    hire_date: Mapped[date] = mapped_column(Date)
    base_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    commission_rate_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    shifts: Mapped[list["Shift"]] = relationship("Shift", back_populates="staff")
    pt_sessions: Mapped[list["PtSession"]] = relationship("PtSession", back_populates="trainer")
    attendance_records: Mapped[list["Attendance"]] = relationship(
        "Attendance", back_populates="staff"
    )
