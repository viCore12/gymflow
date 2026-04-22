import enum
import uuid
from datetime import datetime, timezone as tz

from sqlalchemy import DateTime, Enum, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockTakeStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"


class StockTake(Base):
    __tablename__ = "stock_takes"

    taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(tz.utc)
    )
    status: Mapped[StockTakeStatus] = mapped_column(
        Enum(StockTakeStatus, name="stock_take_status"),
        default=StockTakeStatus.draft,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
