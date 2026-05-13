from sqlalchemy import Column, ForeignKey, Integer, String, Text, UniqueConstraint
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)


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

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="unique_source_external_id"),
    )

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="unique_user_saved_job"),
    )