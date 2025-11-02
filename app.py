# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from saju_logic.calculator import analyze_saju
import os
from datetime import datetime, date
import calendar
from sqlalchemy import Table

# --- 1. 앱 설정 ---
app = Flask(__name__)

# 기본 경로 설정
basedir = os.path.abspath(os.path.dirname(__file__))
# SQLite 데이터베이스 설정
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_very_secret_and_complex_key'  # <-- 매우 중요! 실제 배포 시 변경하세요

# --- 2. 확장 라이브러리 초기화 ---
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
# 로그인이 필요한 페이지에 접근 시 리다이렉트할 경로 설정
login_manager.login_view = 'login'
login_manager.login_message_category = 'info' # flash 메시지 꾸미기 (선택)


# --- 3. 데이터베이스 모델 ---

# 3-1. User와 DesignItem을 연결하는 M2M(다대다) 헬퍼 테이블
# 'user_designs' 테이블은 모델 클래스가 필요 없습니다.
user_designs = db.Table('user_designs',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('design_id', db.Integer, db.ForeignKey('design_item.id'), primary_key=True)
)

# 3-2. DesignItem 모델 (신규)
# 모든 '디자인 아이템' 목록 (상점 카탈로그 역할)
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

# 3-3. User 모델 (수정)
class User(db.Model, UserMixin):
    # ... (id, username, password_hash, name 등 기존 컬럼들) ...
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    birth_datetime = db.Column(db.DateTime, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)

    # --- '저장소' (M2M 관계) ---
    # 이 유저가 '소유한' 디자인 아이템 목록
    owned_designs = db.relationship('DesignItem', secondary=user_designs,
        lazy='subquery', backref=db.backref('owners', lazy=True))
    
    # --- 현재 '적용한' 디자인 (FK 관계) ---
    # default=1 : 1번 디자인 아이템('기본값')을 가리킴 (DB 생성 시 1번 아이템이 존재해야 함)
    active_card_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=1)
    active_effect_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=2)
    active_button_design_id = db.Column(db.Integer, db.ForeignKey('design_item.id'), default=3)

    # UI에서 쉽게 접근하기 위한 관계 설정
    active_card_design = db.relationship('DesignItem', foreign_keys=[active_card_design_id])
    active_effect_design = db.relationship('DesignItem', foreign_keys=[active_effect_design_id])
    active_button_design = db.relationship('DesignItem', foreign_keys=[active_button_design_id])

    # ... (attendance_records, set_password, check_password 함수) ...
    attendance_records = db.relationship('Attendance', backref='user', lazy=True)
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
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
    
# --- 헬퍼 함수: 디자인 보상 지급 ---
def grant_design(user, design_css_class_name):
    """유저에게 디자인 아이템을 보상으로 지급합니다."""
    design = DesignItem.query.filter_by(css_class_name=design_css_class_name).first()
    if design and (design not in user.owned_designs):
        user.owned_designs.append(design)
        db.session.commit()
        flash(f"🎉 보상 획득! [{design.name}] 디자인을 획득했습니다.", "success")
        return True
    return False

# --- 4. Flask-Login 설정 ---
@login_manager.user_loader
def load_user(user_id):
    """세션에서 사용자 ID를 받아 User 객체를 반환"""
    return User.query.get(int(user_id))


# --- 5. 라우트 (Routes) ---

# === 인증 관련 ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # 이미 로그인된 사용자는 메인 페이지로 보냄
    if current_user.is_authenticated:
        return redirect(url_for('main_dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            # 로그인 성공
            login_user(user) # Flask-Login이 세션에 사용자 ID 저장
            flash('로그인되었습니다!', 'success')
            return redirect(url_for('main_dashboard'))
        else:
            # 로그인 실패
            flash('로그인 실패. 아이디나 비밀번호를 확인하세요.', 'danger')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main_dashboard'))
        
    if request.method == 'POST':
        
        # 1. 폼 데이터 가져오기
        username = request.form.get('username')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm') # 비밀번호 확인
        name = request.form.get('name')
        birth_date_str = request.form.get('birth_date') # 'YYYY-MM-DD'
        birth_time_str = request.form.get('birth_time') # 'HH:MM'
        gender = request.form.get('gender')
        phone_number = request.form.get('phone_number') # (선택)

        # 2. 유효성 검사
        
        # 2-1. 비밀번호 일치 확인
        if password != password_confirm:
            flash('비밀번호가 일치하지 않습니다. 다시 확인해주세요.', 'danger')
            return redirect(url_for('register'))

        # 2-2. 아이디 중복 확인 (기존 로직)
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('이미 존재하는 아이디입니다.', 'warning')
            return redirect(url_for('register'))
            
        # 2-3. 생년월일시 합치기
        try:
            # 'YYYY-MM-DD'와 'HH:MM'을 합쳐 datetime 객체로 변환
            birth_datetime_str = f"{birth_date_str} {birth_time_str}"
            birth_datetime = datetime.strptime(birth_datetime_str, '%Y-%m-%d %H:%M')
        except ValueError:
            flash('날짜 또는 시간 형식이 올바르지 않습니다.', 'danger')
            return redirect(url_for('register'))

        # 3. 새 사용자 객체 생성
        new_user = User(
            username=username,
            name=name,
            birth_datetime=birth_datetime,
            gender=gender,
            phone_number=phone_number
        )
        new_user.set_password(password) # 비밀번호 해시
        
        # 4. DB에 저장
        db.session.add(new_user)
        db.session.commit()
        
        flash(f'회원가입 성공! {username}님으로 로그인해주세요.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/logout')
@login_required  # 로그인이 되어 있어야만 접근 가능
def logout():
    logout_user() # Flask-Login이 세션에서 사용자 정보 삭제
    flash('로그아웃되었습니다.', 'info')
    return redirect(url_for('index'))


# === 메인 기능 (보호된 라우트) ===
@app.route('/main')
@login_required
def main_dashboard():
    # current_user 변수를 통해 로그인된 사용자 정보에 접근 가능
    return render_template('main.html', username=current_user.username)

@app.route('/card')
@login_required
def card_generate():
    """
    '카드 생성' 1단계 페이지를 렌더링합니다.
    (데이터 생성은 JS가 /api/generate_card로 요청)
    """
    # 폼 전송 로직(POST)과 card_data 전달 로직 제거
    return render_template('card.html')

@app.route('/api/generate_card', methods=['POST'])
@login_required
def api_generate_card():
    """
    카드 생성 API (JSON 데이터만 반환)
    """
    try:
        # 1. 현재 로그인한 유저의 생년월일시 정보 가져오기
        user_birth_info = current_user.birth_datetime
        
        # 2. 사주 분석 로직 호출 (Keras 모델 실행 등으로 시간이 걸릴 수 있음)
        card_data = analyze_saju(user_birth_info) 
        
        # 3. 성공 시, JSON 형태로 결과 반환
        return jsonify(card_data)
        
    except Exception as e:
        print(e)
        # 4. 실패 시, 에러 메시지 반환
        return jsonify({'error': '카드 생성에 실패했습니다.'}), 500

# === 커스텀 기능 ===
@app.route('/custom')
@login_required
def custom_menu():
    return render_template('custom_menu.html')

@app.route('/custom/<string:design_type>')
@login_required
def custom_design_list(design_type):
    """
    '카드', '효과', '버튼' 디자인 목록 (저장소)을 보여줍니다.
    """
    valid_types = {
        'card': ('카드 디자인', current_user.active_card_design_id),
        'effect': ('효과 디자인', current_user.active_effect_design_id),
        'button': ('버튼 디자인', current_user.active_button_design_id)
    }
    
    if design_type not in valid_types:
        flash('잘못된 접근입니다.', 'danger')
        return redirect(url_for('custom_menu'))

    title, active_design_id = valid_types[design_type]
    
    # 해당 타입의 모든 디자인 아이템 조회
    all_designs = DesignItem.query.filter_by(type=design_type).all()
    # 내가 소유한 디자인 아이템 ID 목록 (빠른 조회를 위해 Set 사용)
    owned_design_ids = {design.id for design in current_user.owned_designs}
    
    return render_template(
        'custom_design_list.html',
        title=title,
        design_type=design_type,
        all_designs=all_designs,
        owned_design_ids=owned_design_ids,
        active_design_id=active_design_id
    )

@app.route('/api/custom/set_active', methods=['POST'])
@login_required
def set_active_design():
    """
    유저가 소유한 디자인을 '적용' (활성화)합니다.
    """
    data = request.get_json()
    design_id = data.get('design_id')
    
    if not design_id:
        return jsonify({'error': '디자인 ID가 없습니다.'}), 400
        
    design = DesignItem.query.get(design_id)
    if not design:
        return jsonify({'error': '존재하지 않는 디자인입니다.'}), 404
    
    # --- 유저가 소유했는지 확인 ---
    if design not in current_user.owned_designs:
        return jsonify({'error': '소유하지 않은 디자인입니다.'}), 403
    
    # --- 타입에 따라 올바른 필드 업데이트 ---
    if design.type == 'card':
        current_user.active_card_design_id = design.id
    elif design.type == 'effect':
        current_user.active_effect_design_id = design.id
    elif design.type == 'button':
        current_user.active_button_design_id = design.id
    else:
        return jsonify({'error': '알 수 없는 디자인 타입입니다.'}), 500
        
    db.session.commit()
    return jsonify({'success': True, 'message': f'[{design.name}] 디자인을 적용했습니다.'})

# --- /attendance 라우트 수정 (보상 지급) ---
@app.route('/attendance', methods=['GET', 'POST'])
@login_required
def attendance():
    today = date.today()
    
    if request.method == 'POST':
        # ... (기존 출석 체크 로직) ...
        existing_check_in = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
        if existing_check_in:
            flash('오늘은 이미 출석체크를 완료했습니다.', 'warning')
        else:
            new_check_in = Attendance(user_id=current_user.id, date=today)
            db.session.add(new_check_in)
            db.session.commit()
            flash('출석체크 완료! ✅', 'success')
            
            # --- 4. [추가] 보상 지급 로직 ---
            total_attendance = len(current_user.attendance_records)
            if total_attendance == 1:
                # 1일차 보상
                grant_design(current_user, 'effect-sparkle')
            elif total_attendance == 3:
                # 3일차 보상
                grant_design(current_user, 'card-ocean')
            # --- ---

        return redirect(url_for('attendance'))

    # --- GET: 이번 달 달력 및 출석 현황 표시 ---
    
    # 1. 이번 달 달력 생성 (예: [[0, 0, 1, 2, 3, 4, 5], [6, 7, ...]])
    # calendar.monthcalendar()는 주를 일요일(0)부터 시작하지 않고 월요일(0)부터 시작합니다.
    # 스케치 이미지는 일요일부터 시작하므로, 요일 헤더 순서를 맞추는 게 중요합니다.
    # 여기서는 Python `calendar` 모듈의 기본값(월요일 시작)을 따르겠습니다.
    year = today.year
    month = today.month
    # calendar.monthcalendar()는 월요일=0, 일요일=6
    calendar_weeks = calendar.monthcalendar(year, month)
    
    # 2. 이번 달 출석 기록 조회 (Set으로 만들면 나중에 조회하기 빠름)
    records = Attendance.query.filter(
        Attendance.user_id == current_user.id,
        db.extract('year', Attendance.date) == year,
        db.extract('month', Attendance.date) == month
    ).all()
    checked_in_days = {record.date.day for record in records} # {1, 2, 5, 8, 9}

    # 3. 오늘 출석했는지 여부 (버튼 비활성화를 위해)
    has_checked_in_today = today.day in checked_in_days
    
    return render_template(
        'attendance.html',
        current_month_str=f"{year}년 {month}월",
        calendar_weeks=calendar_weeks,
        checked_in_days=checked_in_days,
        today_day=today.day,
        has_checked_in_today=has_checked_in_today
    )

# === 설정 ===
@app.route('/settings')
@login_required
def settings_menu():
    return render_template('settings_menu.html')

@app.route('/settings/account', methods=['GET', 'POST'])
@login_required
def settings_account():
    if request.method == 'POST':
        # 1. 폼 데이터 가져오기 (이름, 전화번호)
        name = request.form.get('name')
        phone_number = request.form.get('phone_number')
        
        # 2. 폼 데이터 가져오기 (생년월일, 성별)
        birth_date_str = request.form.get('birth_date')
        birth_time_str = request.form.get('birth_time')
        gender = request.form.get('gender')

        # 3. 생년월일시 데이터 처리
        try:
            birth_datetime_str = f"{birth_date_str} {birth_time_str}"
            birth_datetime = datetime.strptime(birth_datetime_str, '%Y-%m-%d %H:%M')
        except ValueError:
            flash('날짜 또는 시간 형식이 올바르지 않습니다.', 'danger')
            return redirect(url_for('settings_account'))

        # 4. 현재 로그인된 사용자 정보 수정
        user = current_user
        user.name = name
        user.phone_number = phone_number
        user.birth_datetime = birth_datetime
        user.gender = gender
        
        # 5. DB에 저장
        db.session.commit()
        
        flash('개인정보가 성공적으로 수정되었습니다.', 'success')
        return redirect(url_for('settings_account'))
        
    # GET 요청 시: 현재 사용자 정보를 템플릿에 전달
    return render_template('settings_account.html')

@app.route('/settings/features', methods=['GET', 'POST'])
@login_required
def settings_features():
    if request.method == 'POST':
        # TODO: 편의 기능 설정 (언어, 알림) 저장 로직 구현
        # language = request.form.get('language')
        # notice_alert = request.form.get('notice_alert') # 'on' or None
        flash('설정이 저장되었습니다.', 'success')
        return redirect(url_for('settings_features'))
        
    return render_template('settings_features.html')

@app.route('/settings/support')
@login_required
def settings_support():
    # TODO: 공지사항, FAQ 목록을 DB에서 가져오는 로직 구현
    return render_template('settings_support.html')

# TODO: 회원 탈퇴 라우트 생성 (예: /settings/delete_account)

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