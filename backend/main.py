# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
from convert_to_db import init_db

# ==========================================
# 1. 보안 설정 (실제 배포시엔 .env로 빼야 함)
# ==========================================
SECRET_KEY = "YOUR_SECRET_KEY_HERE_CHANGE_THIS" # 임의의 긴 문자열로 변경하세요
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24시간

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# 2. 데이터 모델 (Pydantic)
# ==========================================
class UserAuth(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

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
    conn = sqlite3.connect('./data/saju_database.db', check_same_thread=False)
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
def register(user: UserAuth):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 이미 존재하는 아이디인지 확인
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")
    
    # 비밀번호 해싱 후 저장
    hashed_pw = get_password_hash(user.password)
    cursor.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", 
                   (user.username, hashed_pw))
    conn.commit()
    conn.close()
    
    return {"message": "회원가입 성공"}

# 로그인
@app.post("/api/login", response_model=Token)
def login(user: UserAuth):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 사용자 조회
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    conn.close()
    
    # 사용자 없거나 비번 틀림
    if not db_user or not verify_password(user.password, db_user['hashed_password']):
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
    if row: return dict(row)
    else: return {"error": "데이터 없음"}