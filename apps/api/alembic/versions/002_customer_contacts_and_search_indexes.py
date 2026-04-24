"""customer_contacts table and search indexes

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
    op.create_index(
        "ix_customers_phone",
        "customers",
        ["phone"],
        unique=True,
        postgresql_where=sa.text("phone IS NOT NULL"),
    )
    op.create_index(
        "ix_customers_full_name_pattern",
        "customers",
        ["full_name"],
        postgresql_using="btree",
        postgresql_ops={"full_name": "varchar_pattern_ops"},
    )
    op.create_index(
        "ix_customers_code_pattern",
        "customers",
        ["code"],
        postgresql_using="btree",
        postgresql_ops={"code": "varchar_pattern_ops"},
    )

    op.create_table(
        "customer_contacts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column(
            "contact_type",
            sa.Enum("phone", "email", "emergency", name="contact_type"),
            nullable=False,
        ),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("label", sa.String(100), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
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
    )
    op.create_index(
        "ix_customer_contacts_customer_id",
        "customer_contacts",
        ["customer_id"],
    )


def downgrade() -> None:
    op.drop_table("customer_contacts")
    op.execute("DROP TYPE IF EXISTS contact_type")
    op.drop_index("ix_customers_code_pattern", table_name="customers")
    op.drop_index("ix_customers_full_name_pattern", table_name="customers")
    op.drop_index("ix_customers_phone", table_name="customers")
