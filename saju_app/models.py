# saju_app/models.py
from . import db, bcrypt  # __init__.py에서 생성된 db와 bcrypt 객체를 가져옵니다.
from flask_login import UserMixin
from datetime import datetime, date

# --- 3. 데이터베이스 모델 ---

# 3-1. User와 DesignItem을 연결하는 M2M(다대다) 헬퍼 테이블
user_designs = db.Table('user_designs',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('design_id', db.Integer, db.ForeignKey('design_item.id'), primary_key=True)
)

# 3-2. DesignItem 모델
class DesignItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    # 'type' : 'card', 'effect', 'button'
    type = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.String(200))
    thumbnail_url = db.Column(db.String(200), default='/static/images/thumb_default.png')
    # 예: 'card-style-ocean', 'effect-style-sparkle'
    css_class_name = db.Column(db.String(100), unique=True) 

    def __repr__(self):
        return f"DesignItem('{self.name}', '{self.type}')"

# 3-3. User 모델
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    birth_datetime = db.Column(db.DateTime, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)

    # --- '저장소' (M2M 관계) ---
    owned_designs = db.relationship('DesignItem', secondary=user_designs,
        lazy='subquery', backref=db.backref('owners', lazy=True))
    
    # --- 현재 '적용한' 디자인 (FK 관계) ---
    active_card_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=1)
    active_effect_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=2)
    active_button_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=3)

    # UI에서 쉽게 접근하기 위한 관계 설정
    active_card_design = db.relationship('DesignItem', foreign_keys=[active_card_design_id])
    active_effect_design = db.relationship('DesignItem', foreign_keys=[active_effect_design_id])
    active_button_design = db.relationship('DesignItem', foreign_keys=[active_button_design_id])

    attendance_records = db.relationship('Attendance', backref='user', lazy=True)
    
    def set_password(self, password):
        """비밀번호를 해시하여 저장합니다."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    def check_password(self, password):
        """입력된 비밀번호와 해시된 비밀번호를 비교합니다."""
        return bcrypt.check_password_hash(self.password_hash, password)

# 3-4. Attendance 모델 (User 모델보다 아래에 있어도 관계 설정에 문제없음)
class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # 날짜만 저장 (시간은 필요 없음)
    date = db.Column(db.Date, nullable=False, default=date.today)
    # User 테이블의 id를 외래 키로 참조
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # 한 유저는 하루에 한 번만 출석할 수 있도록 유니크 제약 설정
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)

    def __repr__(self):
        return f"Attendance('{self.user.username}', '{self.date}')"