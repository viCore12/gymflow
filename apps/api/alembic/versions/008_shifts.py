"""shifts table — staff work schedule blocks

Revision ID: 008
Revises: 007
Create Date: 2026-04-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shifts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("staff_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("shift_type", sa.String(50), nullable=False, server_default="regular"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["staff_id"], ["staff.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shifts_date", "shifts", ["date"])
    op.create_index("ix_shifts_staff_id", "shifts", ["staff_id"])
    op.create_index("ix_shifts_staff_date", "shifts", ["staff_id", "date"])


def downgrade() -> None:
    op.drop_index("ix_shifts_staff_date", table_name="shifts")
    op.drop_index("ix_shifts_staff_id", table_name="shifts")
    op.drop_index("ix_shifts_date", table_name="shifts")
    op.drop_table("shifts")
