# backend/convert_to_db.py
import pandas as pd
import sqlite3
import os

def init_db():
    db_path = './data/saju_database.db'
    csv_path = './data/saju_master_db.csv'

    # DB 파일이 이미 있으면 건너뛰기
    if os.path.exists(db_path):
        print("✅ DB가 이미 존재합니다. 생성을 건너뜁니다.")
        return

    print("🔄 DB 파일 생성 중... (약 1~2초 소요)")
    if not os.path.exists(csv_path):
        print("❌ 오류: 원본 CSV 파일이 없습니다.")
        return

    df = pd.read_csv(csv_path)
    conn = sqlite3.connect(db_path)
    df.to_sql('saju_table', conn, if_exists='replace', index=False)
    
    cursor = conn.cursor()
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_date ON saju_table (solar_date)')
    conn.commit()
    conn.close()
    print("✅ DB 생성 완료!")

if __name__ == "__main__":
    init_db()