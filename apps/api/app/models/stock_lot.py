import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockLot(Base):
    __tablename__ = "stock_lots"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("products.id"), index=True
    )
    lot_number: Mapped[str] = mapped_column(String(100), index=True)
    qty: Mapped[int] = mapped_column(Integer, default=0)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
