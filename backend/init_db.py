import pandas as pd
from sqlalchemy import text
import os

# config가 먼저 로드되도록
from core.config import settings
from database import engine, Base


def init_db():
    print("🔄 DB 테이블 검사 중...")

    # 테이블 생성 (없을 때만 생성됨)
    Base.metadata.create_all(bind=engine)

    # 사주 데이터 로딩
    _init_saju_data()

    # 유명인 데이터 로딩
    _init_celebrity_data()


def _init_saju_data():
    """사주 데이터 초기화"""
    csv_path = "./data/saju_master_db.csv"

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 FROM saju_table LIMIT 1"))
            if result.fetchone() is not None:
                print("✅ 사주 데이터가 이미 존재합니다.")
                return
    except Exception as e:
        print(f"⚠️ 테이블 검사 중 경고: {e}")

    if os.path.exists(csv_path):
        print(f"📥 CSV 데이터 로딩 중... ({csv_path})")
        try:
            df = pd.read_csv(csv_path)
            df.to_sql("saju_table", engine, if_exists="append", index=False)
            print("✅ 사주 데이터 입력 완료!")
        except Exception as e:
            print(f"❌ 데이터 입력 실패: {e}")
    else:
        print("⚠️ CSV 파일이 없습니다. 데이터 시딩을 건너뜁니다.")


def _init_celebrity_data():
    """유명인 데이터 초기화"""
    from init_celebrities import init_mbti_celebrities

    init_mbti_celebrities()


if __name__ == "__main__":
    init_db()
