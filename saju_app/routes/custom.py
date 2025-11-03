# saju_app/routes/custom.py
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from .. import db
from ..models import DesignItem

# 'custom'이라는 이름의 Blueprint 생성
custom_bp = Blueprint('custom', __name__)

@custom_bp.route('/custom')
@login_required
def custom_menu():
    """/custom 라우트 - 커스텀 메뉴 페이지"""
    return render_template('custom_menu.html')

@custom_bp.route('/custom/<string:design_type>')
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
        return redirect(url_for('custom.custom_menu'))

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

@custom_bp.route('/api/custom/set_active', methods=['POST'])
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