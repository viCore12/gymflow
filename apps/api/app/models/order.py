import enum
import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class OrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("customers.id"), nullable=True, index=True
    )
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), default=OrderStatus.draft
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
