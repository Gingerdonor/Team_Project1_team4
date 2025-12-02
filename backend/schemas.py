from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# --- 입력 데이터 검증 모델 (Request) ---
class UserRegister(BaseModel):
    username: str
    password: str
    nickname: str
    birthdate: str
    gender: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: str
    birthdate: str
    gender: str


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# --- 응답 데이터 모델 (Response) ---
class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    username: str
    nickname: str
    birthdate: str
    gender: str
    # password는 보안상 반환하지 않음


# --- 분석 결과 관련 스키마 ---
class AnalysisResultResponse(BaseModel):
    id: int
    analysis_date: str
    my_persona: str
    my_destiny: str
    lucky_element: str
    persona_description: Optional[str] = None
    destiny_description: Optional[str] = None
    axes_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CalendarMonthRequest(BaseModel):
    year: int
    month: int


class CalendarDayResponse(BaseModel):
    date: str
    has_analysis: bool
    my_persona: Optional[str] = None
    lucky_element: Optional[str] = None


# --- Admin 관련 스키마 ---


class AnalysisResultUpdate(BaseModel):
    """분석 결과 수정용 스키마"""

    my_persona: Optional[str] = None
    my_destiny: Optional[str] = None
    lucky_element: Optional[str] = None
    persona_description: Optional[str] = None
    destiny_description: Optional[str] = None


class AnalysisResultResponse(BaseModel):
    """분석 결과 응답 스키마"""

    id: int
    username: str
    analysis_date: str
    my_persona: Optional[str]
    my_destiny: Optional[str]
    lucky_element: Optional[str]
    persona_description: Optional[str]
    destiny_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CelebrityCreate(BaseModel):
    """유명인 생성용 스키마"""

    mbti: str
    name: str
    tags: List[str]
    description: Optional[str] = ""
    image_url: Optional[str] = ""


class CelebrityUpdate(BaseModel):
    """유명인 수정용 스키마"""

    mbti: Optional[str] = None
    name: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class CelebrityResponse(BaseModel):
    """유명인 응답 스키마"""

    id: int
    mbti: str
    name: str
    tags: List[str]
    description: Optional[str]
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
