# saju_app/routes/main.py
from flask import Blueprint, render_template, jsonify, redirect, url_for
from flask_login import login_required, current_user
from ..saju_logic.calculator import analyze_saju  # 비즈니스 로직 임포트

# 'main'이라는 이름의 Blueprint 생성
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """/ 라우트 - 인덱스 페이지"""
    # 이미 로그인한 사용자는 대시보드로 보냄
    if current_user.is_authenticated:
        return redirect(url_for('main.main_dashboard'))
    return render_template('index.html')

@main_bp.route('/main')
@login_required
def main_dashboard():
    """/main 라우트 - 메인 대시보드"""
    # current_user 변수를 통해 로그인된 사용자 정보에 접근 가능
    return render_template('main.html', username=current_user.username)

@main_bp.route('/card')
@login_required
def card_generate():
    """
    '카드 생성' 1단계 페이지를 렌더링합니다.
    (데이터 생성은 JS가 /api/generate_card로 요청)
    """
    return render_template('card.html')

@main_bp.route('/api/generate_card', methods=['POST'])
@login_required
def api_generate_card():
    """
    카드 생성 API (JSON 데이터만 반환)
    """
    try:
        # 1. 현재 로그인한 유저의 생년월일시 정보 가져오기
        user_birth_info = current_user.birth_datetime
        
        # 2. 사주 분석 로직 호출
        card_data = analyze_saju(user_birth_info) 
        
        # 3. 성공 시, JSON 형태로 결과 반환
        return jsonify(card_data)
        
    except Exception as e:
        print(f"카드 생성 API 오류: {e}")
        # 4. 실패 시, 에러 메시지 반환
        return jsonify({'error': '카드 생성에 실패했습니다.'}), 500