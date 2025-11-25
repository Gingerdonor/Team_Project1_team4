# backend/convert_to_db.py
import pandas as pd
import sqlite3
import os

def init_db():
    db_path = './data/saju_database.db'
    csv_path = './data/saju_master_db.csv'
    
    # 1. DB 연결 (없으면 생성됨)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 2. Users 테이블 생성 (회원가입용) - 없으면 생성
    # id(username), password(hashed)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hashed_password TEXT NOT NULL
        )
    ''')
    print("✅ Users 테이블 확인/생성 완료")

    # 3. 사주 데이터 테이블 생성 (CSV가 있고, 테이블이 없을 때만 수행)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='saju_table'")
    table_exists = cursor.fetchone()

    if not table_exists and os.path.exists(csv_path):
        print("🔄 사주 데이터 CSV -> DB 변환 중...")
        df = pd.read_csv(csv_path)
        df.to_sql('saju_table', conn, if_exists='replace', index=False)
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_date ON saju_table (solar_date)')
        print("✅ 사주 데이터 변환 완료!")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()