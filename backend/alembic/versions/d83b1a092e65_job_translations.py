"""Preserve original job content and add cached Arabic translations."""
from alembic import op
import sqlalchemy as sa

revision = "d83b1a092e65"
down_revision = "c72a9b830f14"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("jobs", sa.Column("title_ar", sa.Text(), nullable=True))
    op.add_column("jobs", sa.Column("description_ar", sa.Text(), nullable=True))
    # Existing content has not been detected yet; do not assume it is English.
    op.add_column("jobs", sa.Column("original_language", sa.String(16), nullable=False, server_default="und"))


def downgrade():
    op.drop_column("jobs", "original_language")
    op.drop_column("jobs", "description_ar")
    op.drop_column("jobs", "title_ar")
