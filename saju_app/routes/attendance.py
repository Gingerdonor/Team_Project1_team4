# saju_app/routes/attendance.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .. import db
from ..models import Attendance, DesignItem
from datetime import date
import calendar

# 'attendance'라는 이름의 Blueprint 생성
attendance_bp = Blueprint('attendance', __name__)


# --- 헬퍼 함수: 디자인 보상 지급 ---
def grant_design(user, design_css_class_name):
    """유저에게 디자인 아이템을 보상으로 지급합니다. (attendance.py 내부에서만 사용)"""
    design = DesignItem.query.filter_by(css_class_name=design_css_class_name).first()
    if design and (design not in user.owned_designs):
        user.owned_designs.append(design)
        db.session.commit()
        flash(f"🎉 보상 획득! [{design.name}] 디자인을 획득했습니다.", "success")
        return True
    return False

# --- 라우트 ---
@attendance_bp.route('/attendance', methods=['GET', 'POST'])
@login_required
def attendance():
    today = date.today()
    
    if request.method == 'POST':
        existing_check_in = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
        if existing_check_in:
            flash('오늘은 이미 출석체크를 완료했습니다.', 'warning')
        else:
            new_check_in = Attendance(user_id=current_user.id, date=today)
            db.session.add(new_check_in)
            db.session.commit()
            flash('출석체크 완료! ✅', 'success')
            
            # --- 보상 지급 로직 ---
            total_attendance = len(current_user.attendance_records)
            if total_attendance == 1:
                # 1일차 보상
                grant_design(current_user, 'effect-sparkle')
            elif total_attendance == 3:
                # 3일차 보상
                grant_design(current_user, 'card-ocean')

        return redirect(url_for('attendance.attendance'))

    # --- GET: 이번 달 달력 및 출석 현황 표시 ---
    year = today.year
    month = today.month
    calendar_weeks = calendar.monthcalendar(year, month)
    
    records = Attendance.query.filter(
        Attendance.user_id == current_user.id,
        db.extract('year', Attendance.date) == year,
        db.extract('month', Attendance.date) == month
    ).all()
    checked_in_days = {record.date.day for record in records} 

    has_checked_in_today = today.day in checked_in_days
    
    return render_template(
        'attendance.html',
        current_month_str=f"{year}년 {month}월",
        calendar_weeks=calendar_weeks,
        checked_in_days=checked_in_days,
        today_day=today.day,
        has_checked_in_today=has_checked_in_today
    )