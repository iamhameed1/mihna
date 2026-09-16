from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, false, func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    google_sub = Column(String(255), unique=True, nullable=True)
    role = Column(String(50), nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False, server_default=false())

    __table_args__ = (Index("uq_users_email_lower", func.lower(email), unique=True),)

    @property
    def has_password(self):
        return self.password_hash is not None


class AuthCode(Base):
    __tablename__ = "auth_codes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), nullable=False)
    code_hash = Column(String(64), nullable=False)
    purpose = Column(String(32), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, nullable=False, default=0, server_default="0")
    reset_token_hash = Column(String(64), unique=True, nullable=True)
    reset_expires_at = Column(DateTime(timezone=True), nullable=True)
    reset_used_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_auth_codes_email_purpose", "email", "purpose", "id"),)


class AuthRateLimit(Base):
    __tablename__ = "auth_rate_limits"

    key = Column(String(64), primary_key=True)
    window_start = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    salary = Column(String(100), nullable=False)
    link = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    source = Column(String(100), nullable=True)
    external_id = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
    DateTime,
    default=lambda: datetime.now(timezone.utc),
    onupdate=lambda: datetime.now(timezone.utc)
    )

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="unique_user_saved_job"),
    )

class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), nullable=False)
    added_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    status = Column(String(50), nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime, nullable=True)
