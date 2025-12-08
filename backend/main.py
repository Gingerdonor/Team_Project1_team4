"""
FastAPI 앱 엔트리포인트
모든 라우터를 등록하고 앱을 설정합니다.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# 라우터 임포트
from routers import auth, users, analysis, calendar, stats, celebrities, admin

# DB 초기화
from init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 이벤트"""
    print("🚀 서버 시작 - 데이터베이스 초기화 중...")
    init_db()
    print("✅ 데이터베이스 초기화 완료!")
    yield
    print("👋 서버 종료")


# FastAPI 앱 생성
app = FastAPI(
    title="MBTI 사주 분석 API",
    description="사주 기반 MBTI 분석 서비스",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 설정
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(analysis.router)
app.include_router(calendar.router)
app.include_router(stats.router)
app.include_router(celebrities.router)
app.include_router(admin.router)


# 헬스체크
@app.get("/health")
def health_check():
    return {"status": "ok"}
