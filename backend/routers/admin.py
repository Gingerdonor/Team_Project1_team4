from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from collections import Counter
import json

from database import get_db
from core.security import get_admin_user
import models
import schemas

router = APIRouter(prefix="/api/admin", tags=["관리자"])


# --- 대시보드 ---


@router.get("/dashboard")
def admin_dashboard(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """관리자 대시보드 통계"""
    total_users = db.query(models.User).count()
    total_analyses = db.query(models.AnalysisResult).count()
    total_celebrities = db.query(models.MbtiCelebrity).count()

    celebrities = db.query(models.MbtiCelebrity).all()
    celebrity_by_mbti = Counter(c.mbti for c in celebrities)

    recent_analyses = (
        db.query(models.AnalysisResult)
        .order_by(models.AnalysisResult.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "total_celebrities": total_celebrities,
        "celebrity_by_mbti": dict(celebrity_by_mbti),
        "recent_analyses": [
            {
                "id": r.id,
                "username": r.username,
                "analysis_date": r.analysis_date,
                "my_persona": r.my_persona,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_analyses
        ],
    }


# --- 분석 결과 관리 ---


@router.get("/analysis-results")
def admin_get_analysis_results(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    username: str = Query(default=None),
    mbti: str = Query(default=None),
    date_from: str = Query(default=None),
    date_to: str = Query(default=None),
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """분석 결과 목록 조회"""
    query = db.query(models.AnalysisResult)

    if username:
        query = query.filter(models.AnalysisResult.username.ilike(f"%{username}%"))
    if mbti:
        query = query.filter(
            (models.AnalysisResult.my_persona == mbti.upper())
            | (models.AnalysisResult.my_destiny == mbti.upper())
        )
    if date_from:
        query = query.filter(models.AnalysisResult.analysis_date >= date_from)
    if date_to:
        query = query.filter(models.AnalysisResult.analysis_date <= date_to)

    total = query.count()

    results = (
        query.order_by(models.AnalysisResult.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "data": [
            {
                "id": r.id,
                "username": r.username,
                "analysis_date": r.analysis_date,
                "my_persona": r.my_persona,
                "my_destiny": r.my_destiny,
                "lucky_element": r.lucky_element,
                "persona_description": r.persona_description,
                "destiny_description": r.destiny_description,
                "created_at": r.created_at.isoformat(),
            }
            for r in results
        ],
    }


@router.get("/analysis-results/{result_id}")
def admin_get_analysis_result(
    result_id: int,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """분석 결과 상세 조회"""
    result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == result_id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")

    return {
        "id": result.id,
        "username": result.username,
        "analysis_date": result.analysis_date,
        "my_persona": result.my_persona,
        "my_destiny": result.my_destiny,
        "lucky_element": result.lucky_element,
        "persona_description": result.persona_description,
        "destiny_description": result.destiny_description,
        "axes_data": json.loads(result.axes_data) if result.axes_data else None,
        "created_at": result.created_at.isoformat(),
    }


@router.put("/analysis-results/{result_id}")
def admin_update_analysis_result(
    result_id: int,
    update_data: schemas.AnalysisResultUpdate,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """분석 결과 수정"""
    result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == result_id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")

    if update_data.my_persona is not None:
        result.my_persona = update_data.my_persona.upper()
    if update_data.my_destiny is not None:
        result.my_destiny = update_data.my_destiny.upper()
    if update_data.lucky_element is not None:
        result.lucky_element = update_data.lucky_element
    if update_data.persona_description is not None:
        result.persona_description = update_data.persona_description
    if update_data.destiny_description is not None:
        result.destiny_description = update_data.destiny_description

    db.commit()
    db.refresh(result)

    return {"message": "분석 결과가 수정되었습니다.", "id": result.id}


@router.delete("/analysis-results/{result_id}")
def admin_delete_analysis_result(
    result_id: int,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """분석 결과 삭제"""
    result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == result_id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")

    db.delete(result)
    db.commit()

    return {"message": "분석 결과가 삭제되었습니다."}


# --- 유명인 관리 ---


@router.get("/celebrities")
def admin_get_celebrities(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    mbti: str = Query(default=None),
    name: str = Query(default=None),
    tag: str = Query(default=None),
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 목록 조회"""
    query = db.query(models.MbtiCelebrity)

    if mbti:
        query = query.filter(models.MbtiCelebrity.mbti == mbti.upper())
    if name:
        query = query.filter(models.MbtiCelebrity.name.ilike(f"%{name}%"))
    if tag:
        query = query.filter(models.MbtiCelebrity.tags.ilike(f"%{tag}%"))

    total = query.count()

    results = (
        query.order_by(models.MbtiCelebrity.mbti, models.MbtiCelebrity.name)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "data": [
            {
                "id": c.id,
                "mbti": c.mbti,
                "name": c.name,
                "tags": json.loads(c.tags) if c.tags else [],
                "description": c.description,
                "image_url": c.image_url,
                "created_at": c.created_at.isoformat(),
            }
            for c in results
        ],
    }


@router.get("/celebrities/{celebrity_id}")
def admin_get_celebrity(
    celebrity_id: int,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 상세 조회"""
    celebrity = (
        db.query(models.MbtiCelebrity)
        .filter(models.MbtiCelebrity.id == celebrity_id)
        .first()
    )

    if not celebrity:
        raise HTTPException(status_code=404, detail="유명인을 찾을 수 없습니다.")

    return {
        "id": celebrity.id,
        "mbti": celebrity.mbti,
        "name": celebrity.name,
        "tags": json.loads(celebrity.tags) if celebrity.tags else [],
        "description": celebrity.description,
        "image_url": celebrity.image_url,
        "created_at": celebrity.created_at.isoformat(),
    }


@router.post("/celebrities")
def admin_create_celebrity(
    celebrity_data: schemas.CelebrityCreate,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 추가"""
    mbti = celebrity_data.mbti.upper()
    if len(mbti) != 4 or not all(c in "EISNTFJP" for c in mbti):
        raise HTTPException(status_code=400, detail="유효하지 않은 MBTI 유형입니다.")

    new_celebrity = models.MbtiCelebrity(
        mbti=mbti,
        name=celebrity_data.name,
        tags=json.dumps(celebrity_data.tags, ensure_ascii=False),
        description=celebrity_data.description or "",
        image_url=celebrity_data.image_url or "",
    )

    db.add(new_celebrity)
    db.commit()
    db.refresh(new_celebrity)

    return {"message": "유명인이 추가되었습니다.", "id": new_celebrity.id}


@router.put("/celebrities/{celebrity_id}")
def admin_update_celebrity(
    celebrity_id: int,
    update_data: schemas.CelebrityUpdate,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 수정"""
    celebrity = (
        db.query(models.MbtiCelebrity)
        .filter(models.MbtiCelebrity.id == celebrity_id)
        .first()
    )

    if not celebrity:
        raise HTTPException(status_code=404, detail="유명인을 찾을 수 없습니다.")

    if update_data.mbti is not None:
        mbti = update_data.mbti.upper()
        if len(mbti) != 4 or not all(c in "EISNTFJP" for c in mbti):
            raise HTTPException(
                status_code=400, detail="유효하지 않은 MBTI 유형입니다."
            )
        celebrity.mbti = mbti
    if update_data.name is not None:
        celebrity.name = update_data.name
    if update_data.tags is not None:
        celebrity.tags = json.dumps(update_data.tags, ensure_ascii=False)
    if update_data.description is not None:
        celebrity.description = update_data.description
    if update_data.image_url is not None:
        celebrity.image_url = update_data.image_url

    db.commit()
    db.refresh(celebrity)

    return {"message": "유명인 정보가 수정되었습니다.", "id": celebrity.id}


@router.delete("/celebrities/{celebrity_id}")
def admin_delete_celebrity(
    celebrity_id: int,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 삭제"""
    celebrity = (
        db.query(models.MbtiCelebrity)
        .filter(models.MbtiCelebrity.id == celebrity_id)
        .first()
    )

    if not celebrity:
        raise HTTPException(status_code=404, detail="유명인을 찾을 수 없습니다.")

    db.delete(celebrity)
    db.commit()

    return {"message": "유명인이 삭제되었습니다."}
