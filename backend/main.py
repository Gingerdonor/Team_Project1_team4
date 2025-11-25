from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sqlite3
from convert_to_db import init_db 

# ==========================================
# Lifespan: 서버 시작/종료 시 실행할 작업 정의
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 서버 시작 시 실행: DB가 없으면 생성
    init_db()
    yield
    # 2. 서버 종료 시 실행: (필요시 여기에 종료 작업 추가)
    pass

# ==========================================
# 앱 초기화 (lifespan 적용)
# ==========================================
app = FastAPI(lifespan=lifespan)

# ==========================================
# CORS 설정
# ==========================================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DB 연결 헬퍼 함수
# ==========================================
def get_db_connection():
    conn = sqlite3.connect('./data/saju_database.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# API 엔드포인트
# ==========================================
@app.get("/")
def read_root():
    return {"message": "Welcome to My Destina API Server!"}

@app.get("/api/saju/{target_date}")
def get_saju(target_date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # DB에서 날짜로 조회
    cursor.execute("SELECT * FROM saju_table WHERE solar_date = ?", (target_date,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    else:
        return {"error": "데이터가 없습니다."} # 혹은 HTTPException 사용