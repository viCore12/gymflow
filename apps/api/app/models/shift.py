import uuid
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Index, String, Text, Time, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.staff import Staff


class Shift(Base):
    __tablename__ = "shifts"
    __table_args__ = (
        Index("ix_shifts_staff_date", "staff_id", "date"),
    )

    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("staff.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    shift_type: Mapped[str] = mapped_column(String(50), default="regular")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)

    staff: Mapped["Staff"] = relationship("Staff", back_populates="shifts", lazy="selectin")

    @property
    def staff_full_name(self) -> str:
        return self.staff.full_name if self.staff else ""
