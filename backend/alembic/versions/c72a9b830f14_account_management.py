"""Add email verification, account challenges, and case-insensitive email uniqueness."""
from alembic import op
import sqlalchemy as sa

revision = "c72a9b830f14"
down_revision = "9a41c2d7e610"
branch_labels = None
depends_on = None


def upgrade():
    # Fail transactionally without merging, deleting, or rewriting existing accounts.
    # Runs in offline-generated SQL too. The lock prevents a concurrent duplicate insert.
    op.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE")
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT lower(email) FROM users GROUP BY lower(email) HAVING count(*) > 1) THEN
                RAISE EXCEPTION 'Case-insensitive duplicate user emails exist. Resolve account ownership before retrying migration c72a9b830f14.';
            END IF;
        END $$;
    """)
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)
    op.create_table(
        "auth_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("purpose", sa.String(32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reset_token_hash", sa.String(64), unique=True),
        sa.Column("reset_expires_at", sa.DateTime(timezone=True)),
        sa.Column("reset_used_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_auth_codes_email_purpose", "auth_codes", ["email", "purpose", "id"])
    op.create_table("auth_rate_limits",
                    sa.Column("key", sa.String(64), primary_key=True),
                    sa.Column("window_start", sa.Integer(), nullable=False),
                    sa.Column("count", sa.Integer(), nullable=False))


def downgrade():
    op.drop_table("auth_rate_limits")
    op.drop_index("ix_auth_codes_email_purpose", table_name="auth_codes")
    op.drop_table("auth_codes")
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_column("users", "email_verified")
