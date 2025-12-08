from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
import json
import random

from database import get_db
from core.security import get_current_user
import models
import logic
import schemas

router = APIRouter(prefix="/api/analyze", tags=["분석"])


def get_random_celebrity(
    db: Session,
    mbti: str,
    include_tags: list = None,
    exclude_tags: list = None,
):
    """
    MBTI에 해당하는 유명인 중 태그 조건에 맞는 1명을 랜덤으로 반환
    """
    celebrities = (
        db.query(models.MbtiCelebrity)
        .filter(models.MbtiCelebrity.mbti == mbti.upper())
        .all()
    )

    if not celebrities:
        return None

    # 태그 필터링
    filtered = []
    for celeb in celebrities:
        try:
            celeb_tags = json.loads(celeb.tags) if celeb.tags else []
        except (json.JSONDecodeError, TypeError):
            celeb_tags = []

        # include_tags가 있으면 하나라도 포함되어야 함 (OR 조건)
        if include_tags:
            if not any(tag in celeb_tags for tag in include_tags):
                continue

        # exclude_tags가 있으면 해당 태그가 없어야 함
        if exclude_tags:
            if any(tag in celeb_tags for tag in exclude_tags):
                continue

        filtered.append(celeb)

    if not filtered:
        # 필터 조건에 맞는 결과가 없으면 전체에서 랜덤 선택
        return random.choice(celebrities)

    return random.choice(filtered)


def celebrity_to_dict(celebrity) -> dict:
    """MbtiCelebrity 객체를 딕셔너리로 변환"""
    if not celebrity:
        return None

    try:
        tags = json.loads(celebrity.tags) if celebrity.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []

    return {
        "name": celebrity.name,
        "tags": tags,
        "description": celebrity.description,
        "image_url": celebrity.image_url,
    }


@router.get(
    "/today",
    response_model=schemas.AnalysisTodayResponse,
    summary="오늘의 MBTI 분석",
    description="""
    사용자의 생년월일과 오늘 날짜의 사주를 기반으로 MBTI를 분석합니다.
    
    - **my_persona**: 오늘의 나의 MBTI
    - **my_destiny**: 오늘 잘 맞는 상대의 MBTI  
    - **lucky_element**: 오늘의 행운의 원소 (목, 화, 토, 금, 수)
    - **celebrity**: MBTI에 해당하는 유명인 (랜덤)
    - **include_tags**: 포함할 태그 필터 (콤마 구분)
    """,
    responses={
        200: {"description": "분석 성공"},
        404: {"description": "사주 데이터 없음"},
        401: {"description": "인증 필요"},
    },
)
def analyze_today(
    include_tags: str = Query(default=None, description="포함할 태그 (콤마 구분)"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """오늘의 분석"""
    # 내 생일 사주 조회
    birth_row = (
        db.query(models.Saju)
        .filter(models.Saju.solar_date == current_user.birthdate)
        .first()
    )

    # 오늘 날짜 사주 조회
    today_str = date.today().isoformat()
    today_row = (
        db.query(models.Saju).filter(models.Saju.solar_date == today_str).first()
    )

    if not birth_row or not today_row:
        raise HTTPException(status_code=404, detail="사주 데이터 없음")

    # 사주 변환
    def row_to_saju(row):
        y = logic.parse_ganji_to_index(row.year_ganji)
        m = logic.parse_ganji_to_index(row.month_ganji)
        d = logic.parse_ganji_to_index(row.day_ganji)
        return [y[0], y[1], m[0], m[1], d[0], d[1]]

    birth_saju = row_to_saju(birth_row)
    today_saju = row_to_saju(today_row)

    birth_prof = logic.saju_to_profile(birth_saju)
    today_prof = logic.saju_to_profile(today_saju)
    combined = logic.combine_profiles(birth_prof, today_prof, birth_weight=0.4)

    axes_base = logic.profile_to_axes(combined)
    axes = logic.apply_daily_rotation(axes_base, today_saju)

    my_mbti = logic.axes_to_mbti(axes)
    partner_mbti = logic.get_destiny_partner(axes)

    p_text, d_text = logic.generate_explanation(
        combined, axes, my_mbti, partner_mbti, today_saju
    )

    lucky_element_key = max(combined["elements"], key=combined["elements"].get)
    partner_axes = logic.get_compatibility_details(axes)

    # ✅ 태그 파싱
    tag_list = None
    if include_tags:
        tag_list = [t.strip() for t in include_tags.split(",") if t.strip()]

    # ✅ 유명인 매칭 (태그 필터 적용)
    my_celebrity = get_random_celebrity(db, my_mbti, include_tags=tag_list)
    partner_celebrity = get_random_celebrity(db, partner_mbti, include_tags=tag_list)

    # DB에 저장
    existing_result = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date == today_str,
        )
        .first()
    )

    if existing_result:
        existing_result.my_persona = my_mbti
        existing_result.my_destiny = partner_mbti
        existing_result.lucky_element = logic.ELEMENT_KO[lucky_element_key][0]
        existing_result.persona_description = p_text
        existing_result.destiny_description = d_text
        existing_result.axes_data = json.dumps(axes)
    else:
        new_result = models.AnalysisResult(
            username=current_user.username,
            analysis_date=today_str,
            my_persona=my_mbti,
            my_destiny=partner_mbti,
            lucky_element=logic.ELEMENT_KO[lucky_element_key][0],
            persona_description=p_text,
            destiny_description=d_text,
            axes_data=json.dumps(axes),
        )
        db.add(new_result)

    db.commit()

    return {
        "my_persona": my_mbti,
        "my_destiny": partner_mbti,
        "lucky_element": logic.ELEMENT_KO[lucky_element_key][0],
        "persona_data": {
            "mbti": my_mbti,
            "description": p_text,
            "axes": axes,
            "celebrity": celebrity_to_dict(my_celebrity),
        },
        "destiny_data": {
            "mbti": partner_mbti,
            "description": d_text,
            "axes": partner_axes,
            "celebrity": celebrity_to_dict(partner_celebrity),
        },
    }
