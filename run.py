from saju_app import create_app, db
from saju_app.models import DesignItem

app = create_app()

# --- DB 초기화 (기본 아이템 생성) ---
def init_database():
    """ (선택) DB가 비어있을 때 기본 디자인 아이템을 생성합니다. """
    try:
        # 1번 아이템이 있는지 확인
        if DesignItem.query.get(1):
            return # 이미 아이템이 있으므로 종료
        
        print("데이터베이스 초기화: 기본 디자인 아이템 생성 중...")
        
        # 1. 기본 카드
        default_card = DesignItem(id=1, name='기본 카드', type='card', 
            description='가장 기본적인 카드 디자인입니다.', css_class_name='card-default')
        # 2. 기본 효과
        default_effect = DesignItem(id=2, name='기본 효과', type='effect', 
            description='기본 로딩 효과입니다.', css_class_name='effect-default')
        # 3. 기본 버튼
        default_button = DesignItem(id=3, name='기본 버튼', type='button', 
            description='기본 카드 뽑기 버튼입니다.', css_class_name='button-default')
        
        # 4. (보상) 3일차 카드
        ocean_card = DesignItem(name='푸른 바다', type='card', 
            description='3일 출석 보상', css_class_name='card-ocean')
        # 5. (보상) 1일차 효과
        sparkle_effect = DesignItem(name='반짝임', type='effect', 
            description='1일 출석 보상', css_class_name='effect-sparkle')

        db.session.add_all([
            default_card, default_effect, default_button, 
            ocean_card, sparkle_effect
        ])
        db.session.commit()
        print("기본 아이템 생성이 완료되었습니다.")

    except Exception as e:
        print(f"DB 초기화 중 오류 발생: {e}")
        db.session.rollback()

# 앱 실행
if __name__ == '__main__':
    with app.app_context():
        # 앱 실행 시 데이터베이스 파일이 없으면 자동 생성
        db.create_all()
        init_database()  # 기본 아이템 생성
    app.run(debug=True)