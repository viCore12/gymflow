from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone as tz
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.stock_take_line import StockTakeLine


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

    lines: Mapped[list[StockTakeLine]] = relationship(back_populates="stock_take")
