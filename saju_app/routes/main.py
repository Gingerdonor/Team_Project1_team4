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
    
@main_bp.route('/saju_detail')
@login_required
def saju_detail():
    """
    카드 결과에서 '사주 상세 분석'을 눌렀을 때 보여줄 페이지
    """
    
    # TODO: 현재 유저의 생년월일시(current_user.birth_datetime)를 기반으로
    # 상세 사주 풀이 로직을 수행합니다.
    
    # 예시: saju_logic.calculator.py 에 새로운 함수를 만들어서 호출
    # analysis_result = analyze_saju_detail(current_user.birth_datetime)
    
    # 임시 상세 분석 데이터
    analysis_result = {
        'title': '상세 사주 분석 결과',
        
        # |safe 필터가 적용되므로 HTML 태그를 사용합니다.
        'content': """
            <p><strong>[총운]</strong> 
            당신은 <strong>밝은 태양(丙火)</strong>과 같이 따뜻하고 열정적인 에너지를 지니고 태어났습니다. 
            주변 사람들에게 긍정적인 영향을 주며, 리더십이 돋보이는 기운입니다. 
            항상 새로운 도전을 즐기며, 창의적인 아이디어가 넘칩니다.
            </p>
            <p>
            다만, 때때로 그 열정이 너무 강해 주변을 살피지 못할 때가 있으니, 
            중요한 결정을 내릴 때는 한 걸음 물러서서 상황을 객관적으로 판단하는 지혜가 필요합니다.
            </p>
        """,
        
        'five_elements': '전체적으로 <strong>화(火)</strong> 기운이 강하며, 이를 조절해 줄 <strong>수(水)</strong> 기운이 용신(用神)으로 작용합니다.',
        'shipsin': '<strong>식신(食神)</strong>이 발달하여 표현력이 좋고 예술적 감각이 뛰어나지만, <strong>편관(偏官)</strong>의 기운이 약해 때로 조직 생활에 답답함을 느낄 수 있습니다.'
    }

    # 'saju_detail.html'이라는 새 템플릿 파일을 만들어 렌더링합니다.
    return render_template('saju_detail.html', result=analysis_result)