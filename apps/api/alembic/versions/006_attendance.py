"""attendance and attendance_audit tables

Revision ID: 006
Revises: 005
Create Date: 2026-04-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "attendance",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("staff_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_out", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("adjusted_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("adjusted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("adjustment_reason", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["staff_id"], ["staff.id"]),
        sa.ForeignKeyConstraint(["adjusted_by_user_id"], ["users.id"]),
    )
    op.create_index("ix_attendance_staff_id", "attendance", ["staff_id"])
    op.create_index("ix_attendance_date", "attendance", ["date"])
    op.create_index("ix_attendance_staff_date", "attendance", ["staff_id", "date"])

    op.create_table(
        "attendance_audit",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("attendance_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("field_changed", sa.String(50), nullable=True),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("changed_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False),
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
        sa.ForeignKeyConstraint(["attendance_id"], ["attendance.id"]),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"]),
    )
    op.create_index(
        "ix_attendance_audit_attendance_id", "attendance_audit", ["attendance_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_attendance_audit_attendance_id", table_name="attendance_audit")
    op.drop_table("attendance_audit")
    op.drop_index("ix_attendance_staff_date", table_name="attendance")
    op.drop_index("ix_attendance_date", table_name="attendance")
    op.drop_index("ix_attendance_staff_id", table_name="attendance")
    op.drop_table("attendance")
