# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
from fastapi.security import OAuth2PasswordBearer
from datetime import date

from convert_to_db import init_db
import logic


def validate_birthdate(date_str: str):
    """생년월일이 1950~2050 사이인지 검사"""
    try:
        year = int(date_str.split("-")[0])  # YYYY-MM-DD에서 연도 추출
        if not (1950 <= year <= 2050):
            raise ValueError("범위 초과")
    except:
        # 날짜 형식이 이상하거나 범위를 벗어난 경우
        raise HTTPException(
            status_code=400,
            detail="생년월일은 1950년 1월 1일부터 2050년 12월 31일 사이여야 합니다.",
        )


# ==========================================
# 인증 의존성 (Token 검증용)
# ==========================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="자격 증명 실패")
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰 만료 또는 오류")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없음")
    return dict(user)


# ==========================================
# 1. 보안 설정 (실제 배포시엔 .env로 빼야 함)
# ==========================================
SECRET_KEY = "YOUR_SECRET_KEY_HERE_CHANGE_THIS"  # 임의의 긴 문자열로 변경하세요
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24시간

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# 2. 데이터 모델 (Pydantic)
# ==========================================
class UserRegister(BaseModel):
    username: str
    password: str
    nickname: str
    birthdate: str  # YYYY-MM-DD
    gender: str  # male / female


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: str
    birthdate: str
    gender: str


class Token(BaseModel):
    access_token: str
    token_type: str


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# ==========================================
# 3. 유틸리티 함수 (해싱, 토큰 생성)
# ==========================================
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError as e:
        print(f"Hash verify error: {e}")
        return False


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_db_connection():
    conn = sqlite3.connect("./data/saju_database.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ==========================================
# 4. 앱 설정
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

# CORS 설정 (기존과 동일)
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 5. API 엔드포인트
# ==========================================


# 회원가입
@app.post("/api/register")
def register(user: UserRegister):
    validate_birthdate(user.birthdate)
    conn = get_db_connection()
    cursor = conn.cursor()

    # 중복 확인
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")

    hashed_pw = get_password_hash(user.password)

    # 추가된 정보 저장
    cursor.execute(
        "INSERT INTO users (username, hashed_password, nickname, birthdate, gender) VALUES (?, ?, ?, ?, ?)",
        (user.username, hashed_pw, user.nickname, user.birthdate, user.gender),
    )
    conn.commit()
    conn.close()

    return {"message": "회원가입 성공"}


# 로그인
@app.post("/api/login", response_model=Token)
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 사용자 조회
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    conn.close()

    # 사용자 없거나 비번 틀림
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 토큰 발급
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# 사주 조회
@app.get("/api/saju/{target_date}")
def get_saju(target_date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saju_table WHERE solar_date = ?", (target_date,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    else:
        return {"error": "데이터 없음"}


# 내 정보 가져오기
@app.get("/api/users/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    # 보안상 해시된 비밀번호는 제외하고 반환
    return {
        "username": current_user["username"],
        "nickname": current_user["nickname"],
        "birthdate": current_user["birthdate"],
        "gender": current_user["gender"],
    }


@app.put("/api/users/profile")
def update_profile(info: UserUpdate, current_user: dict = Depends(get_current_user)):
    validate_birthdate(info.birthdate)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET nickname = ?, birthdate = ?, gender = ? WHERE username = ?",
        (info.nickname, info.birthdate, info.gender, current_user["username"]),
    )
    conn.commit()
    conn.close()

    return {"message": "프로필이 업데이트되었습니다."}


# 비밀번호 변경
@app.put("/api/users/password")
def change_password(
    pw_data: PasswordChange, current_user: dict = Depends(get_current_user)
):
    # 기존 비밀번호 확인
    if not verify_password(pw_data.old_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=400, detail="현재 비밀번호가 일치하지 않습니다."
        )

    # 새 비밀번호 해싱 및 업데이트
    new_hashed_pw = get_password_hash(pw_data.new_password)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET hashed_password = ? WHERE username = ?",
        (new_hashed_pw, current_user["username"]),
    )
    conn.commit()
    conn.close()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}


# 회원 탈퇴
@app.delete("/api/users/me")
def delete_account(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE username = ?", (current_user["username"],))
    conn.commit()
    conn.close()

    return {"message": "계정이 삭제되었습니다."}


@app.get("/api/analyze/today")
def analyze_today(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. 사용자 생일 데이터 조회
    birthdate = current_user["birthdate"]  # YYYY-MM-DD
    cursor.execute("SELECT * FROM saju_table WHERE solar_date = ?", (birthdate,))
    birth_row = cursor.fetchone()

    # 2. 오늘 날짜 데이터 조회
    today_str = date.today().isoformat()
    cursor.execute("SELECT * FROM saju_table WHERE solar_date = ?", (today_str,))
    today_row = cursor.fetchone()
    conn.close()

    if not birth_row:
        raise HTTPException(
            status_code=404,
            detail="생년월일 데이터를 DB에서 찾을 수 없습니다. (DB 범위 확인)",
        )
    if not today_row:
        raise HTTPException(
            status_code=404, detail="오늘 날짜 데이터를 DB에서 찾을 수 없습니다."
        )

    # 3. DB 데이터를 인덱스 리스트로 변환 (logic.py 사용을 위해)
    # row['year_ganji'] -> "갑자(甲子)" -> [1, 1]
    def row_to_saju(row):
        y = logic.parse_ganji_to_index(row["year_ganji"])
        m = logic.parse_ganji_to_index(row["month_ganji"])
        d = logic.parse_ganji_to_index(row["day_ganji"])
        return [y[0], y[1], m[0], m[1], d[0], d[1]]

    birth_saju = row_to_saju(birth_row)
    today_saju = row_to_saju(today_row)

    # 4. 분석 로직 실행
    birth_prof = logic.saju_to_profile(birth_saju)
    today_prof = logic.saju_to_profile(today_saju)
    combined = logic.combine_profiles(birth_prof, today_prof)

    axes_base = logic.profile_to_axes(combined)
    axes = logic.apply_daily_rotation(axes_base, today_saju)

    my_mbti = logic.axes_to_mbti(axes)
    partner_mbti = logic.get_destiny_partner(axes)

    p_text, d_text = logic.generate_explanation(
        combined, axes, my_mbti, partner_mbti, today_saju
    )

    return {
        "my_persona": my_mbti,
        "my_destiny": partner_mbti,
        "persona_desc": p_text,
        "destiny_desc": d_text,
        "lucky_element": logic.ELEMENT_KO[
            max(combined["elements"], key=combined["elements"].get)
        ][
            0
        ],  # 가장 강한 오행
    }
