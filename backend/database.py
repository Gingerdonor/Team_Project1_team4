from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable set")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency (API에서 DB 세션을 쓰기 위함)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
