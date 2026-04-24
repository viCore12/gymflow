import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AttendanceSource(str, enum.Enum):
    manual = "manual"
    # fingerprint = "fingerprint"  # Phase 2


class Attendance(Base):
    __tablename__ = "attendance"

    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("staff.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    adjusted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
    adjusted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    adjustment_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    staff = relationship("Staff", back_populates="attendance_records", lazy="selectin")
    audit_entries = relationship(
        "AttendanceAudit",
        back_populates="attendance",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_attendance_staff_date", "staff_id", "date"),
    )

    @property
    def staff_full_name(self) -> str:
        return self.staff.full_name if self.staff else ""

    @property
    def has_adjustment(self) -> bool:
        return self.adjusted_by_user_id is not None
