import os

from environment import load_environment
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_environment()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
