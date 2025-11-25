from sqlalchemy import Column, Integer, String, Date
from database import Base


class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    hashed_password = Column(String, nullable=False)
    nickname = Column(String)
    birthdate = Column(String)  # YYYY-MM-DD
    gender = Column(String)


class Saju(Base):
    __tablename__ = "saju_table"

    solar_date = Column(String, primary_key=True, index=True)  # YYYY-MM-DD
    year_ganji = Column(String)
    month_ganji = Column(String)
    day_ganji = Column(String)
