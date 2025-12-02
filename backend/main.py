from fastapi import FastAPI, HTTPException, Depends, status, Request, Path, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from datetime import date, datetime
import os
import json
import random
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()  # .env 파일 로드

# 우리가 만든 모듈들 임포트
from database import get_db, engine
import models
import logic
import schemas
from init_db import init_db
from models import MbtiCelebrity

# 보안 관련 (기존 코드 유지)
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from typing import List, Set

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY environment variable set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# 토큰 블랙리스트 (로그아웃된 토큰 저장)
# 프로덕션에서는 Redis 등 사용 권장
token_blacklist: Set[str] = set()


# --- Utility Functions ---
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def validate_birthdate(date_str: str):
    try:
        year = int(date_str.split("-")[0])
        if not (1950 <= year <= 2050):
            raise ValueError
    except:
        raise HTTPException(
            status_code=400, detail="생년월일은 1950~2050년 사이여야 합니다."
        )


def get_random_celebrity(
    db: Session,
    mbti: str,
    include_tags: Optional[List[str]] = None,
    exclude_tags: Optional[List[str]] = None,
):
    """
    MBTI에 해당하는 유명인 중 태그 조건에 맞는 1명을 랜덤으로 반환

    Args:
        db: 데이터베이스 세션
        mbti: MBTI 유형 (예: "INTJ")
        include_tags: 포함해야 할 태그 리스트 (예: ["남자", "만화캐릭터"])
        exclude_tags: 제외해야 할 태그 리스트 (예: ["실제인물"])

    Returns:
        MbtiCelebrity 객체 또는 None
    """
    # 해당 MBTI의 모든 유명인 조회
    celebrities = (
        db.query(MbtiCelebrity).filter(MbtiCelebrity.mbti == mbti.upper()).all()
    )

    if not celebrities:
        return None

    # 태그 필터링
    filtered = []
    for celeb in celebrities:
        try:
            celeb_tags = json.loads(celeb.tags)
        except (json.JSONDecodeError, TypeError):
            celeb_tags = []

        # include_tags가 있으면 모든 태그가 포함되어야 함
        if include_tags:
            if not all(tag in celeb_tags for tag in include_tags):
                continue

        # exclude_tags가 있으면 해당 태그가 없어야 함
        if exclude_tags:
            if any(tag in celeb_tags for tag in exclude_tags):
                continue

        filtered.append(celeb)

    if not filtered:
        # 필터 조건에 맞는 결과가 없으면 전체에서 랜덤 선택
        return random.choice(celebrities)

    return random.choice(filtered)


def celebrity_to_dict(celebrity: MbtiCelebrity) -> dict:
    """MbtiCelebrity 객체를 딕셔너리로 변환"""
    if not celebrity:
        return None

    try:
        tags = json.loads(celebrity.tags)
    except (json.JSONDecodeError, TypeError):
        tags = []

    return {
        "name": celebrity.name,
        "tags": tags,
        "description": celebrity.description,
        "image_url": celebrity.image_url,
    }


# --- App Setup ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # 서버 시작 시 DB 초기화
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Dependencies ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    # 블랙리스트 확인
    if token in token_blacklist:
        raise HTTPException(status_code=401, detail="로그아웃된 토큰입니다.")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)

    # ORM 방식으로 사용자 조회
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401)
    return user


# --- APIs ---


@app.post("/api/register")
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    validate_birthdate(user.birthdate)

    # 중복 검사 (ORM)
    existing_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")

    # 저장 (ORM)
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_pw,
        nickname=user.nickname,
        birthdate=user.birthdate,
        gender=user.gender,
    )
    db.add(new_user)
    db.commit()

    return {"message": "회원가입 성공"}


@app.post("/api/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    # 사용자 조회 (form_data.username 사용)
    db_user = (
        db.query(models.User).filter(models.User.username == form_data.username).first()
    )

    # 비밀번호 검증 (form_data.password 사용)
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호 오류")

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/logout")
def logout(token: str = Depends(oauth2_scheme)):
    """로그아웃 - 토큰을 블랙리스트에 추가"""
    token_blacklist.add(token)
    return {"message": "로그아웃 성공"}


@app.get("/api/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    # Pydantic 모델이 아니므로 dict로 변환하거나 필요한 필드만 반환
    return {
        "username": current_user.username,
        "nickname": current_user.nickname,
        "birthdate": current_user.birthdate,
        "gender": current_user.gender,
    }


@app.put("/api/users/profile")
def update_profile(
    info: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    validate_birthdate(info.birthdate)

    # ORM 객체 수정 후 commit하면 끝 (SQL UPDATE 불필요)
    current_user.nickname = info.nickname
    current_user.birthdate = info.birthdate
    current_user.gender = info.gender

    db.commit()
    db.refresh(current_user)

    return {"message": "프로필 업데이트 완료"}


@app.put("/api/users/password")
def change_password(
    pw_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(pw_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="기존 비밀번호 불일치")

    current_user.hashed_password = get_password_hash(pw_data.new_password)
    db.commit()

    return {"message": "비밀번호 변경 완료"}


@app.delete("/api/users/me")
def delete_account(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": "계정 삭제 완료"}


@app.get("/api/analyze/today")
def analyze_today(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # 1. 내 생일 사주 조회 (ORM)
    birth_row = (
        db.query(models.Saju)
        .filter(models.Saju.solar_date == current_user.birthdate)
        .first()
    )

    # 2. 오늘 날짜 사주 조회
    today_str = date.today().isoformat()
    today_row = (
        db.query(models.Saju).filter(models.Saju.solar_date == today_str).first()
    )

    if not birth_row or not today_row:
        raise HTTPException(status_code=404, detail="사주 데이터 없음")

    # logic.py 연동을 위한 변환 헬퍼
    def row_to_saju(row):
        y = logic.parse_ganji_to_index(row.year_ganji)
        m = logic.parse_ganji_to_index(row.month_ganji)
        d = logic.parse_ganji_to_index(row.day_ganji)
        return [y[0], y[1], m[0], m[1], d[0], d[1]]

    birth_saju = row_to_saju(birth_row)
    today_saju = row_to_saju(today_row)

    birth_prof = logic.saju_to_profile(birth_saju)
    today_prof = logic.saju_to_profile(today_saju)
    combined = logic.combine_profiles(birth_prof, today_prof, birth_weight=0.4)

    axes_base = logic.profile_to_axes(combined)
    axes = logic.apply_daily_rotation(axes_base, today_saju)

    my_mbti = logic.axes_to_mbti(axes)
    partner_mbti = logic.get_destiny_partner(axes)

    p_text, d_text = logic.generate_explanation(
        combined, axes, my_mbti, partner_mbti, today_saju
    )

    lucky_element_key = max(combined["elements"], key=combined["elements"].get)

    partner_axes = logic.get_compatibility_details(axes)

    my_celebrity = get_random_celebrity(db, my_mbti)
    partner_celebrity = get_random_celebrity(db, partner_mbti)

    # 분석 결과를 DB에 저장
    existing_result = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date == today_str,
        )
        .first()
    )

    if existing_result:
        # 기존 결과 업데이트
        existing_result.my_persona = my_mbti
        existing_result.my_destiny = partner_mbti
        existing_result.lucky_element = logic.ELEMENT_KO[lucky_element_key][0]
        existing_result.persona_description = p_text
        existing_result.destiny_description = d_text
        existing_result.axes_data = json.dumps(axes)
    else:
        # 새 결과 저장
        new_result = models.AnalysisResult(
            username=current_user.username,
            analysis_date=today_str,
            my_persona=my_mbti,
            my_destiny=partner_mbti,
            lucky_element=logic.ELEMENT_KO[lucky_element_key][0],
            persona_description=p_text,
            destiny_description=d_text,
            axes_data=json.dumps(axes),
        )
        db.add(new_result)

    db.commit()

    return {
        "my_persona": my_mbti,
        "my_destiny": partner_mbti,
        "lucky_element": logic.ELEMENT_KO[lucky_element_key][0],
        "persona_data": {
            "mbti": my_mbti,
            "description": p_text,
            "axes": axes,
            "celebrity": celebrity_to_dict(my_celebrity),
        },
        "destiny_data": {
            "mbti": partner_mbti,
            "description": d_text,
            "axes": partner_axes,
            "celebrity": celebrity_to_dict(partner_celebrity),
        },
    }


# --- 캘린더 관련 API ---
# 주의: 더 구체적인 경로를 먼저 정의해야 함!


@app.get("/api/calendar/history")
def get_analysis_history(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """분석 결과 히스토리 조회 (최근 N개)"""
    results = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.username == current_user.username)
        .order_by(models.AnalysisResult.analysis_date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "analysis_date": r.analysis_date,
            "my_persona": r.my_persona,
            "my_destiny": r.my_destiny,
            "lucky_element": r.lucky_element,
            "created_at": r.created_at.isoformat(),
        }
        for r in results
    ]


@app.get("/api/calendar/detail")
def get_calendar_date(
    date_str: str = Query(..., description="조회할 날짜 (YYYY-MM-DD 형식)"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """특정 날짜의 분석 결과 상세 조회 (쿼리 파라미터 방식)"""
    # 날짜 형식 검증
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력하세요.",
        )

    result = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date == date_str,
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="해당 날짜의 분석 결과가 없습니다.")

    return {
        "id": result.id,
        "analysis_date": result.analysis_date,
        "my_persona": result.my_persona,
        "my_destiny": result.my_destiny,
        "lucky_element": result.lucky_element,
        "persona_description": result.persona_description,
        "destiny_description": result.destiny_description,
        "axes_data": json.loads(result.axes_data) if result.axes_data else None,
        "created_at": result.created_at.isoformat(),
    }


@app.get("/api/calendar/month/{year}/{month}")
def get_calendar_month(
    year: int = Path(..., ge=1950, le=2100),
    month: int = Path(..., ge=1, le=12),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """특정 월의 분석 결과 목록 조회 (캘린더용)"""
    # 해당 월의 시작일과 종료일 계산
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"

    results = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date >= start_date,
            models.AnalysisResult.analysis_date < end_date,
        )
        .all()
    )

    # 날짜별로 정리
    calendar_data = {}
    for result in results:
        calendar_data[result.analysis_date] = {
            "has_analysis": True,
            "my_persona": result.my_persona,
            "lucky_element": result.lucky_element,
        }

    return {"year": year, "month": month, "data": calendar_data}


# --- 통계 관련 API ---


@app.get("/api/stats/monthly")
def get_monthly_stats(
    year: int = Query(default=None, ge=1950, le=2100),
    month: int = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """전체 유저 월간 통계 조회 (인증 불필요 - 공개 통계)"""
    from collections import Counter

    # 기본값: 현재 년월
    if year is None:
        year = date.today().year
    if month is None:
        month = date.today().month

    # 해당 월의 시작일과 종료일 계산
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"

    # 해당 월의 모든 분석 결과 조회
    results = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.analysis_date >= start_date,
            models.AnalysisResult.analysis_date < end_date,
        )
        .all()
    )

    if not results:
        return {
            "year": year,
            "month": month,
            "total_analyses": 0,
            "unique_users": 0,
            "persona_stats": {},
            "destiny_stats": {},
            "axes_stats": {
                "E_I": {"E": 0, "I": 0, "E_percent": 0, "I_percent": 0},
                "S_N": {"S": 0, "N": 0, "S_percent": 0, "N_percent": 0},
                "T_F": {"T": 0, "F": 0, "T_percent": 0, "F_percent": 0},
                "J_P": {"J": 0, "P": 0, "J_percent": 0, "P_percent": 0},
            },
            "top_persona": None,
            "top_destiny": None,
            "element_stats": {},
        }

    total_analyses = len(results)
    unique_users = len(set(r.username for r in results))

    # MBTI 통계
    persona_counter = Counter(r.my_persona for r in results if r.my_persona)
    destiny_counter = Counter(r.my_destiny for r in results if r.my_destiny)

    # 상위 MBTI
    top_persona = persona_counter.most_common(1)[0] if persona_counter else None
    top_destiny = destiny_counter.most_common(1)[0] if destiny_counter else None

    # MBTI 축별 통계 계산
    axes_counts = {
        "E_I": {"E": 0, "I": 0},
        "S_N": {"S": 0, "N": 0},
        "T_F": {"T": 0, "F": 0},
        "J_P": {"J": 0, "P": 0},
    }

    for result in results:
        if result.my_persona and len(result.my_persona) == 4:
            mbti = result.my_persona
            axes_counts["E_I"][mbti[0]] = axes_counts["E_I"].get(mbti[0], 0) + 1
            axes_counts["S_N"][mbti[1]] = axes_counts["S_N"].get(mbti[1], 0) + 1
            axes_counts["T_F"][mbti[2]] = axes_counts["T_F"].get(mbti[2], 0) + 1
            axes_counts["J_P"][mbti[3]] = axes_counts["J_P"].get(mbti[3], 0) + 1

    # 퍼센트 계산 - 새 딕셔너리 생성
    axes_stats = {}
    for axis_key, axis_data in axes_counts.items():
        total = sum(axis_data.values())
        axes_stats[axis_key] = {}
        for char, count in axis_data.items():
            axes_stats[axis_key][char] = count
            if total > 0:
                axes_stats[axis_key][f"{char}_percent"] = round(
                    (count / total) * 100, 1
                )
            else:
                axes_stats[axis_key][f"{char}_percent"] = 0

    # 행운의 원소 통계
    element_counter = Counter(r.lucky_element for r in results if r.lucky_element)
    element_total = sum(element_counter.values())
    element_stats = {
        elem: {
            "count": count,
            "percent": (
                round((count / element_total) * 100, 1) if element_total > 0 else 0
            ),
        }
        for elem, count in element_counter.most_common()
    }

    # MBTI별 비율 계산
    def counter_to_stats(counter, total):
        return {
            mbti: {
                "count": count,
                "percent": round((count / total) * 100, 1) if total > 0 else 0,
            }
            for mbti, count in counter.most_common()
        }

    return {
        "year": year,
        "month": month,
        "total_analyses": total_analyses,
        "unique_users": unique_users,
        "persona_stats": counter_to_stats(persona_counter, total_analyses),
        "destiny_stats": counter_to_stats(destiny_counter, total_analyses),
        "axes_stats": axes_stats,
        "top_persona": (
            {"mbti": top_persona[0], "count": top_persona[1]} if top_persona else None
        ),
        "top_destiny": (
            {"mbti": top_destiny[0], "count": top_destiny[1]} if top_destiny else None
        ),
        "element_stats": element_stats,
    }


@app.get("/api/stats/all-time")
def get_all_time_stats(db: Session = Depends(get_db)):
    """전체 기간 통계 조회"""
    from collections import Counter

    results = db.query(models.AnalysisResult).all()

    if not results:
        return {
            "total_analyses": 0,
            "unique_users": 0,
            "persona_stats": {},
            "destiny_stats": {},
            "axes_stats": {
                "E_I": {"E": 0, "I": 0, "E_percent": 0, "I_percent": 0},
                "S_N": {"S": 0, "N": 0, "S_percent": 0, "N_percent": 0},
                "T_F": {"T": 0, "F": 0, "T_percent": 0, "F_percent": 0},
                "J_P": {"J": 0, "P": 0, "J_percent": 0, "P_percent": 0},
            },
            "element_stats": {},
        }

    total_analyses = len(results)
    unique_users = len(set(r.username for r in results))

    persona_counter = Counter(r.my_persona for r in results if r.my_persona)
    destiny_counter = Counter(r.my_destiny for r in results if r.my_destiny)
    element_counter = Counter(r.lucky_element for r in results if r.lucky_element)

    # 축별 통계
    axes_counts = {
        "E_I": {"E": 0, "I": 0},
        "S_N": {"S": 0, "N": 0},
        "T_F": {"T": 0, "F": 0},
        "J_P": {"J": 0, "P": 0},
    }

    for result in results:
        if result.my_persona and len(result.my_persona) == 4:
            mbti = result.my_persona
            axes_counts["E_I"][mbti[0]] = axes_counts["E_I"].get(mbti[0], 0) + 1
            axes_counts["S_N"][mbti[1]] = axes_counts["S_N"].get(mbti[1], 0) + 1
            axes_counts["T_F"][mbti[2]] = axes_counts["T_F"].get(mbti[2], 0) + 1
            axes_counts["J_P"][mbti[3]] = axes_counts["J_P"].get(mbti[3], 0) + 1

    # 퍼센트 계산 - 새 딕셔너리 생성
    axes_stats = {}
    for axis_key, axis_data in axes_counts.items():
        total = sum(axis_data.values())
        axes_stats[axis_key] = {}
        for char, count in axis_data.items():
            axes_stats[axis_key][char] = count
            if total > 0:
                axes_stats[axis_key][f"{char}_percent"] = round(
                    (count / total) * 100, 1
                )
            else:
                axes_stats[axis_key][f"{char}_percent"] = 0

    def counter_to_stats(counter, total):
        return {
            item: {
                "count": count,
                "percent": round((count / total) * 100, 1) if total > 0 else 0,
            }
            for item, count in counter.most_common()
        }

    return {
        "total_analyses": total_analyses,
        "unique_users": unique_users,
        "persona_stats": counter_to_stats(persona_counter, total_analyses),
        "destiny_stats": counter_to_stats(destiny_counter, total_analyses),
        "axes_stats": axes_stats,
        "element_stats": counter_to_stats(element_counter, total_analyses),
    }


@app.get("/api/celebrity/{mbti}")
def get_celebrity_by_mbti(
    mbti: str,
    include_tags: str = Query(
        default=None, description="포함할 태그 (콤마 구분, 예: 남자,만화캐릭터)"
    ),
    exclude_tags: str = Query(
        default=None, description="제외할 태그 (콤마 구분, 예: 실제인물)"
    ),
    db: Session = Depends(get_db),
):
    """특정 MBTI에 해당하는 유명인 조회 (태그 필터링 지원)"""
    mbti = mbti.upper()

    if len(mbti) != 4 or not all(c in "EISNTFJP" for c in mbti):
        raise HTTPException(status_code=400, detail="유효하지 않은 MBTI 유형입니다.")

    # 콤마로 구분된 태그를 리스트로 변환
    include_list = (
        [t.strip() for t in include_tags.split(",")] if include_tags else None
    )
    exclude_list = (
        [t.strip() for t in exclude_tags.split(",")] if exclude_tags else None
    )

    celebrity = get_random_celebrity(db, mbti, include_list, exclude_list)

    if not celebrity:
        return {
            "mbti": mbti,
            "celebrity": None,
            "message": "해당 조건의 유명인이 없습니다.",
        }

    return {"mbti": mbti, "celebrity": celebrity_to_dict(celebrity)}
