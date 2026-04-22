import uuid

from sqlalchemy import ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


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
