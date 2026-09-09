"""Allow Google identities and passwordless users."""
from alembic import op
import sqlalchemy as sa

revision = "9a41c2d7e610"
down_revision = "808bca403933"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=True)
    op.add_column("users", sa.Column("google_sub", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_users_google_sub", "users", ["google_sub"])


def downgrade():
    connection = op.get_bind()
    if connection.execute(sa.text("SELECT 1 FROM users WHERE password_hash IS NULL LIMIT 1")).first():
        raise RuntimeError("Set passwords for Google-only users before downgrading.")
    op.drop_constraint("uq_users_google_sub", "users", type_="unique")
    op.drop_column("users", "google_sub")
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=False)
