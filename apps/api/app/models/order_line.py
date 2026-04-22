import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class OrderLine(Base):
    __tablename__ = "order_lines"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("orders.id"), index=True
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("products.id"), nullable=True
    )
    plan_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("membership_plans.id"), nullable=True
    )
    description: Mapped[str] = mapped_column(String(500))
    qty: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
