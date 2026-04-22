"""customer_checkins table

Revision ID: 003
Revises: 002
Create Date: 2026-04-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customer_checkins",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("checked_in_by", sa.Uuid(), nullable=True),
        sa.Column("method", sa.String(50), nullable=False, server_default="manual"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["customers.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["checked_in_by"], ["users.id"], ondelete="SET NULL"
        ),
    )
    op.create_index(
        "ix_customer_checkins_customer_id",
        "customer_checkins",
        ["customer_id"],
    )
    op.create_index(
        "ix_customer_checkins_checked_in_at",
        "customer_checkins",
        ["checked_in_at"],
    )


def downgrade() -> None:
    op.drop_table("customer_checkins")
