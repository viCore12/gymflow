from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.stock_take import StockTake


class StockTakeLine(Base):
    __tablename__ = "stock_take_lines"

    stock_take_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("stock_takes.id"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("products.id")
    )
    system_qty: Mapped[int] = mapped_column(Integer)
    counted_qty: Mapped[int] = mapped_column(Integer)

    stock_take: Mapped[StockTake] = relationship(back_populates="lines")
