from sqlalchemy import Column, Integer, String, Text
from database import Base


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