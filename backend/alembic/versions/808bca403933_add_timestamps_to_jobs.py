"""add timestamps to jobs

Revision ID: 808bca403933
Revises: 313520ac847b
Create Date: 2026-05-16 22:04:41.768874
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "808bca403933"
down_revision: Union[str, Sequence[str], None] = "313520ac847b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        column["name"]
        for column in inspector.get_columns("jobs")
    }

    if "created_at" not in columns:
        op.add_column(
            "jobs",
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )

    if "updated_at" not in columns:
        op.add_column(
            "jobs",
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )

    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("jobs")
        if constraint["name"]
    }

    if "unique_source_external_id" in unique_constraints:
        op.drop_constraint(
            "unique_source_external_id",
            "jobs",
            type_="unique",
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {
        column["name"]
        for column in inspector.get_columns("jobs")
    }

    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("jobs")
        if constraint["name"]
    }

    if "unique_source_external_id" not in unique_constraints:
        op.create_unique_constraint(
            "unique_source_external_id",
            "jobs",
            ["source", "external_id"],
        )

    if "updated_at" in columns:
        op.drop_column("jobs", "updated_at")

    if "created_at" in columns:
        op.drop_column("jobs", "created_at")