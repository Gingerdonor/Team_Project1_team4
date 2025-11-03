# saju_app/routes/auth.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user, login_required
from ..models import User
from .. import db, bcrypt
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # 이미 로그인된 사용자는 메인 페이지로 보냄
    if current_user.is_authenticated:
        return redirect(url_for('main.main_dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            # 로그인 성공
            login_user(user) # Flask-Login이 세션에 사용자 ID 저장
            flash('로그인되었습니다!', 'success')
            return redirect(url_for('main.main_dashboard'))
        else:
            # 로그인 실패
            flash('로그인 실패. 아이디나 비밀번호를 확인하세요.', 'danger')
            
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.main_dashboard'))
        
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
            return redirect(url_for('auth.register'))

        # 2-2. 아이디 중복 확인 (기존 로직)
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('이미 존재하는 아이디입니다.', 'warning')
            return redirect(url_for('auth.register'))
            
        # 2-3. 생년월일시 합치기
        try:
            # 'YYYY-MM-DD'와 'HH:MM'을 합쳐 datetime 객체로 변환
            birth_datetime_str = f"{birth_date_str} {birth_time_str}"
            birth_datetime = datetime.strptime(birth_datetime_str, '%Y-%m-%d %H:%M')
        except ValueError:
            flash('날짜 또는 시간 형식이 올바르지 않습니다.', 'danger')
            return redirect(url_for('auth.register'))

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
        return redirect(url_for('auth.login'))
        
    return render_template('register.html')

@auth_bp.route('/logout')
@login_required  # 로그인이 되어 있어야만 접근 가능
def logout():
    logout_user() # Flask-Login이 세션에서 사용자 정보 삭제
    flash('로그아웃되었습니다.', 'info')
    return redirect(url_for('main.index'))