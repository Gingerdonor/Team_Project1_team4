from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import random

from database import get_db
import models

router = APIRouter(prefix="/api/celebrities", tags=["유명인"])


@router.get("/tags/all")
def get_all_tags(db: Session = Depends(get_db)):
    """모든 유명인의 태그 목록 조회 (중복 제거)"""
    celebrities = db.query(models.MbtiCelebrity).all()

    all_tags = set()
    for celeb in celebrities:
        try:
            celeb_tags = json.loads(celeb.tags) if celeb.tags else []
            all_tags.update(celeb_tags)
        except (json.JSONDecodeError, TypeError):
            continue

    # 태그를 정렬해서 반환
    return {"tags": sorted(list(all_tags)), "count": len(all_tags)}


@router.get("/{mbti}")
def get_celebrity_by_mbti(
    mbti: str,
    include_tags: str = Query(default=None, description="포함할 태그 (콤마 구분)"),
    exclude_tags: str = Query(default=None, description="제외할 태그 (콤마 구분)"),
    db: Session = Depends(get_db),
):
    """특정 MBTI에 해당하는 유명인 랜덤 조회 (태그 필터링 지원)"""
    mbti = mbti.upper()

    if len(mbti) != 4 or not all(c in "EISNTFJP" for c in mbti):
        raise HTTPException(status_code=400, detail="유효하지 않은 MBTI 유형입니다.")

    # 해당 MBTI의 모든 유명인 조회
    celebrities = (
        db.query(models.MbtiCelebrity).filter(models.MbtiCelebrity.mbti == mbti).all()
    )

    if not celebrities:
        return {
            "mbti": mbti,
            "celebrity": None,
            "message": "해당 MBTI의 유명인이 없습니다.",
        }

    # 태그 필터링
    include_list = (
        [t.strip() for t in include_tags.split(",")] if include_tags else None
    )
    exclude_list = (
        [t.strip() for t in exclude_tags.split(",")] if exclude_tags else None
    )

    filtered = []
    for celeb in celebrities:
        try:
            celeb_tags = json.loads(celeb.tags) if celeb.tags else []
        except (json.JSONDecodeError, TypeError):
            celeb_tags = []

        if include_list:
            if not all(tag in celeb_tags for tag in include_list):
                continue

        if exclude_list:
            if any(tag in celeb_tags for tag in exclude_list):
                continue

        filtered.append(celeb)

    # 필터 결과가 없으면 전체에서 선택
    selected = random.choice(filtered) if filtered else random.choice(celebrities)

    try:
        tags = json.loads(selected.tags) if selected.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []

    return {
        "mbti": mbti,
        "celebrity": {
            "id": selected.id,
            "name": selected.name,
            "tags": tags,
            "description": selected.description,
            "image_url": selected.image_url,
        },
    }


@router.get("/{mbti}/all")
def get_all_celebrities_by_mbti(
    mbti: str,
    db: Session = Depends(get_db),
):
    """특정 MBTI의 모든 유명인 조회"""
    mbti = mbti.upper()

    if len(mbti) != 4 or not all(c in "EISNTFJP" for c in mbti):
        raise HTTPException(status_code=400, detail="유효하지 않은 MBTI 유형입니다.")

    celebrities = (
        db.query(models.MbtiCelebrity).filter(models.MbtiCelebrity.mbti == mbti).all()
    )

    return {
        "mbti": mbti,
        "count": len(celebrities),
        "celebrities": [
            {
                "id": c.id,
                "name": c.name,
                "tags": json.loads(c.tags) if c.tags else [],
                "description": c.description,
                "image_url": c.image_url,
            }
            for c in celebrities
        ],
    }
