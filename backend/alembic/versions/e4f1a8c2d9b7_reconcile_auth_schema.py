"""Reconcile authentication schema without recreating existing auth tables."""
from alembic import op
import sqlalchemy as sa


revision = "e4f1a8c2d9b7"
down_revision = "d83b1a092e65"
branch_labels = None
depends_on = None


USER_COLUMNS = {
    "google_sub": sa.Column("google_sub", sa.String(255), nullable=True),
    "email_verified": sa.Column(
        "email_verified", sa.Boolean(), nullable=False, server_default=sa.false()
    ),
}
AUTH_CODE_COLUMNS = {
    "id", "user_id", "email", "code_hash", "purpose", "expires_at", "used_at",
    "created_at", "attempts", "reset_token_hash", "reset_expires_at", "reset_used_at",
}
RATE_LIMIT_COLUMNS = {"key", "window_start", "count"}


def _index_names(bind, table_name):
    return {
        index["name"]
        for index in sa.inspect(bind).get_indexes(table_name)
        if index.get("name")
    }


def _table_columns(bind, table_name):
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _require_existing_table_shape(bind, table_name, required_columns):
    if not sa.inspect(bind).has_table(table_name):
        raise RuntimeError(
            f"Expected existing authentication table {table_name!r} was not found; "
            "reconcile it separately rather than creating it implicitly."
        )
    missing = required_columns - _table_columns(bind, table_name)
    if missing:
        raise RuntimeError(
            f"Existing authentication table {table_name!r} is missing columns: "
            f"{', '.join(sorted(missing))}. No table was recreated."
        )


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_columns = _table_columns(bind, "users")

    for name, column in USER_COLUMNS.items():
        if name not in user_columns:
            op.add_column("users", column)

    if any(column["name"] == "password_hash" and column["nullable"] is False
           for column in inspector.get_columns("users")):
        op.alter_column(
            "users", "password_hash", existing_type=sa.String(255), nullable=True
        )

    unique_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("users")
        if constraint.get("name")
    }
    if "uq_users_google_sub" not in unique_constraints:
        op.create_unique_constraint("uq_users_google_sub", "users", ["google_sub"])

    index_names = _index_names(bind, "users")
    if "uq_users_email_lower" not in index_names:
        op.create_index(
            "uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True
        )

    _require_existing_table_shape(bind, "auth_codes", AUTH_CODE_COLUMNS)
    _require_existing_table_shape(bind, "auth_rate_limits", RATE_LIMIT_COLUMNS)

    auth_code_indexes = _index_names(bind, "auth_codes")
    if "ix_auth_codes_email_purpose" not in auth_code_indexes:
        op.create_index(
            "ix_auth_codes_email_purpose",
            "auth_codes",
            ["email", "purpose", "id"],
        )


def downgrade():
    raise RuntimeError(
        "This reconciliation is forward-only; restore the verified backup instead "
        "of removing authentication columns from live users."
    )
