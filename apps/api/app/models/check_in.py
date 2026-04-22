import uuid
from datetime import datetime, timezone as tz

from sqlalchemy import DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CheckIn(Base):
    __tablename__ = "check_ins"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("customers.id"), index=True
    )
    membership_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("memberships.id")
    )
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(tz.utc), index=True
    )
