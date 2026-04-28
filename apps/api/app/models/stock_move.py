import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockMoveType(str, enum.Enum):
    in_ = "in"
    out = "out"
    adjustment = "adjustment"


class StockMoveStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    rejected = "rejected"


class StockMove(Base):
    __tablename__ = "stock_moves"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("products.id"), index=True
    )
    move_type: Mapped[StockMoveType] = mapped_column(
        Enum("in", "out", "adjustment", name="stock_move_type")
    )
    qty: Mapped[int] = mapped_column(Integer)
    status: Mapped[StockMoveStatus] = mapped_column(
        Enum(StockMoveStatus, name="stock_move_status"),
        default=StockMoveStatus.draft,
        index=True,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
