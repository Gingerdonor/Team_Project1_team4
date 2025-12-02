import os
from pathlib import Path
from dotenv import load_dotenv

# backend 폴더 기준으로 .env 파일 경로 설정
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
ENV_FILE = BASE_DIR / ".env"

# .env 파일 로드
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    print(f"⚠️ Warning: {ENV_FILE} not found")


class Settings:
    """앱 설정"""

    # 보안
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # 데이터베이스
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # 관리자
    ADMIN_USERNAMES: set = {"admin", "administrator"}

    # 디버그
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    def validate(self):
        """설정 유효성 검사"""
        if not self.SECRET_KEY:
            raise ValueError(f"No SECRET_KEY in {ENV_FILE}")
        if not self.DATABASE_URL:
            raise ValueError(f"No DATABASE_URL in {ENV_FILE}")


settings = Settings()
settings.validate()
