from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ❗ 아래 주소의 id:password를 아까 설정한 것으로 바꾸세요
SQLALCHEMY_DATABASE_URL = "postgresql://myuser:mypassword@localhost/saju_db"

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
