from pydantic import BaseModel, Field
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


# --- 응답 스키마 추가 ---


class MessageResponse(BaseModel):
    """기본 메시지 응답"""

    message: str


class CelebrityData(BaseModel):
    """유명인 데이터"""

    name: str
    tags: List[str]
    description: Optional[str] = None
    image_url: Optional[str] = None


class PersonaData(BaseModel):
    """페르소나 분석 데이터"""

    mbti: str
    description: str
    axes: Dict[str, Dict[str, float]]
    celebrity: Optional[CelebrityData] = None


class DestinyData(BaseModel):
    """운명 분석 데이터"""

    mbti: str
    description: str
    axes: Dict[str, Dict[str, float]]
    celebrity: Optional[CelebrityData] = None


class AnalysisTodayResponse(BaseModel):
    """오늘의 분석 응답"""

    my_persona: str
    my_destiny: str
    lucky_element: str
    persona_data: PersonaData
    destiny_data: DestinyData


class HealthResponse(BaseModel):
    """헬스체크 응답"""

    status: str
    debug: bool


class PaginatedResponse(BaseModel):
    """페이지네이션 응답 기본"""

    total: int
    page: int
    per_page: int
    total_pages: int


class AdminDashboardResponse(BaseModel):
    """관리자 대시보드 응답"""

    total_users: int
    total_analyses: int
    total_celebrities: int
    celebrity_by_mbti: Dict[str, int]
    recent_analyses: List[Dict[str, Any]]
