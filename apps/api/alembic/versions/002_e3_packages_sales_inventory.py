"""E3: memberships, orders, inventory (packages / sales / stock)

Revision ID: 002
Revises: 001
Create Date: 2026-04-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- memberships ---
    op.create_table(
        "memberships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sessions_left", sa.Integer(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["membership_plans.id"]),
    )
    op.create_index("ix_memberships_customer_id", "memberships", ["customer_id"])
    op.create_index("ix_memberships_plan_id", "memberships", ["plan_id"])
    op.create_index("ix_memberships_end_at", "memberships", ["end_at"])

    # --- check_ins ---
    op.create_table(
        "check_ins",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("membership_id", sa.Uuid(), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["membership_id"], ["memberships.id"]),
    )
    op.create_index("ix_check_ins_customer_id", "check_ins", ["customer_id"])
    op.create_index("ix_check_ins_checked_in_at", "check_ins", ["checked_in_at"])

    # --- orders ---
    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("order_number", sa.String(50), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("draft", "confirmed", "cancelled", name="order_status"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
    )
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])

    # --- order_lines ---
    op.create_table(
        "order_lines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("plan_id", sa.Uuid(), nullable=True),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["membership_plans.id"]),
    )
    op.create_index("ix_order_lines_order_id", "order_lines", ["order_id"])

    # --- stock_moves ---
    op.create_table(
        "stock_moves",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column(
            "move_type",
            sa.Enum("in", "out", "adjustment", name="stock_move_type"),
            nullable=False,
        ),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "approved", "rejected", name="stock_move_status"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("approved_by_id", sa.Uuid(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
    )
    op.create_index("ix_stock_moves_product_id", "stock_moves", ["product_id"])
    op.create_index("ix_stock_moves_status", "stock_moves", ["status"])

    # --- stock_lots ---
    op.create_table(
        "stock_lots",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("lot_number", sa.String(100), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
    )
    op.create_index("ix_stock_lots_product_id", "stock_lots", ["product_id"])
    op.create_index("ix_stock_lots_lot_number", "stock_lots", ["lot_number"])
    op.create_index("ix_stock_lots_expiry_date", "stock_lots", ["expiry_date"])

    # --- stock_takes ---
    op.create_table(
        "stock_takes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "confirmed", name="stock_take_status"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    # --- stock_take_lines ---
    op.create_table(
        "stock_take_lines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("stock_take_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("system_qty", sa.Integer(), nullable=False),
        sa.Column("counted_qty", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["stock_take_id"], ["stock_takes.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
    )
    op.create_index("ix_stock_take_lines_stock_take_id", "stock_take_lines", ["stock_take_id"])


def downgrade() -> None:
    op.drop_table("stock_take_lines")
    op.drop_table("stock_takes")
    op.drop_table("stock_lots")
    op.drop_table("stock_moves")
    op.drop_table("order_lines")
    op.drop_table("orders")
    op.drop_table("check_ins")
    op.drop_table("memberships")
    op.execute("DROP TYPE IF EXISTS order_status")
    op.execute("DROP TYPE IF EXISTS stock_move_type")
    op.execute("DROP TYPE IF EXISTS stock_move_status")
    op.execute("DROP TYPE IF EXISTS stock_take_status")
