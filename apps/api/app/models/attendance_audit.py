import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AttendanceAudit(Base):
    __tablename__ = "attendance_audit"

    attendance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("attendance.id"), index=True
    )
    action: Mapped[str] = mapped_column(String(20))
    field_changed: Mapped[str | None] = mapped_column(String(50), nullable=True)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    attendance = relationship("Attendance", back_populates="audit_entries")
