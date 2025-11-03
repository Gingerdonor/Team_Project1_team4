# saju_app/routes/settings.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .. import db
from datetime import datetime

# 'settings'라는 이름의 Blueprint 생성
settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings')
@login_required
def settings_menu():
    """/settings 라우트 - 설정 메인 메뉴"""
    return render_template('settings_menu.html')

@settings_bp.route('/settings/account', methods=['GET', 'POST'])
@login_required
def settings_account():
    """/settings/account - 개인정보 수정"""
    if request.method == 'POST':
        # 1. 폼 데이터 가져오기
        name = request.form.get('name')
        phone_number = request.form.get('phone_number')
        birth_date_str = request.form.get('birth_date')
        birth_time_str = request.form.get('birth_time')
        gender = request.form.get('gender')

        # 2. 생년월일시 데이터 처리
        try:
            birth_datetime_str = f"{birth_date_str} {birth_time_str}"
            birth_datetime = datetime.strptime(birth_datetime_str, '%Y-%m-%d %H:%M')
        except ValueError:
            flash('날짜 또는 시간 형식이 올바 G르지 않습니다.', 'danger')
            return redirect(url_for('settings.settings_account'))

        # 3. 현재 로그인된 사용자 정보 수정
        user = current_user
        user.name = name
        user.phone_number = phone_number
        user.birth_datetime = birth_datetime
        user.gender = gender
        
        # 4. DB에 저장
        db.session.commit()
        
        flash('개인정보가 성공적으로 수정되었습니다.', 'success')
        return redirect(url_for('settings.settings_account'))
        
    # GET 요청 시: 현재 사용자 정보를 템플릿에 전달
    return render_template('settings_account.html')

@settings_bp.route('/settings/features', methods=['GET', 'POST'])
@login_required
def settings_features():
    """/settings/features - 편의 기능 설정"""
    if request.method == 'POST':
        # TODO: 편의 기능 설정 (언어, 알림) 저장 로직 구현
        flash('설정이 저장되었습니다.', 'success')
        return redirect(url_for('settings.settings_features'))
        
    return render_template('settings_features.html')

@settings_bp.route('/settings/support')
@login_required
def settings_support():
    """/settings/support - 고객 지원 (공지, FAQ)"""
    # TODO: 공지사항, FAQ 목록을 DB에서 가져오는 로직 구현
    return render_template('settings_support.html')

# TODO: 회원 탈퇴 라우트 생성 (예: /settings/delete_account)