from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# config에서 설정 가져오기 (여기서 .env가 로드됨)
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """API에서 DB 세션을 쓰기 위한 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
