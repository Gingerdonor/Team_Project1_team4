import pandas as pd
from database import engine, Base
from sqlalchemy import text
import os


def init_db():
    print("🔄 DB 테이블 검사 중...")

    # 테이블 생성 (없을 때만 생성됨)
    Base.metadata.create_all(bind=engine)

    csv_path = "./data/saju_master_db.csv"

    # ✅ 데이터 존재 여부 확인 (로직 개선)
    try:
        with engine.connect() as conn:
            # SQLAlchemy 2.0에서는 SQL 문자열을 text()로 감싸야 합니다.
            result = conn.execute(text("SELECT 1 FROM saju_table LIMIT 1"))
            if result.fetchone() is not None:
                print("✅ 사주 데이터가 이미 존재합니다. (데이터 로딩 건너뜀)")
                return
    except Exception as e:
        print(f"⚠️ 테이블 검사 중 경고: {e}")
        # 테이블이 없거나 기타 에러 시에는 진행

    # 데이터가 없을 때만 아래 로직 실행
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


if __name__ == "__main__":
    init_db()
