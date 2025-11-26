from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    hashed_password = Column(String, nullable=False)
    nickname = Column(String)
    birthdate = Column(String)  # YYYY-MM-DD
    gender = Column(String)

    # 분석 결과와의 관계 설정
    analysis_results = relationship(
        "AnalysisResult", back_populates="user", cascade="all, delete-orphan"
    )


class Saju(Base):
    __tablename__ = "saju_table"

    solar_date = Column(String, primary_key=True, index=True)  # YYYY-MM-DD
    year_ganji = Column(String)
    month_ganji = Column(String)
    day_ganji = Column(String)


class AnalysisResult(Base):
    """유저별 일일 분석 결과 저장 테이블"""

    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, ForeignKey("users.username"), nullable=False, index=True)
    analysis_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    my_persona = Column(String)  # MBTI 결과
    my_destiny = Column(String)  # 운명의 파트너 MBTI
    lucky_element = Column(String)  # 행운의 원소
    persona_description = Column(Text)  # 페르소나 설명
    destiny_description = Column(Text)  # 운명 설명
    axes_data = Column(Text)  # JSON 형태의 axes 데이터
    created_at = Column(DateTime, default=datetime.utcnow)

    # User와의 관계
    user = relationship("User", back_populates="analysis_results")
