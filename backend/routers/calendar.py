from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from datetime import datetime
import json

from database import get_db
from core.security import get_current_user
import models

router = APIRouter(prefix="/api/calendar", tags=["캘린더"])


@router.get("/history")
def get_analysis_history(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """분석 결과 히스토리 조회"""
    results = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.username == current_user.username)
        .order_by(models.AnalysisResult.analysis_date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "analysis_date": r.analysis_date,
            "my_persona": r.my_persona,
            "my_destiny": r.my_destiny,
            "lucky_element": r.lucky_element,
            "created_at": r.created_at.isoformat(),
        }
        for r in results
    ]


@router.get("/detail")
def get_calendar_date(
    date_str: str = Query(..., description="조회할 날짜 (YYYY-MM-DD)"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """특정 날짜의 분석 결과 상세 조회"""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다.")

    result = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date == date_str,
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="해당 날짜의 분석 결과가 없습니다.")

    return {
        "id": result.id,
        "analysis_date": result.analysis_date,
        "my_persona": result.my_persona,
        "my_destiny": result.my_destiny,
        "lucky_element": result.lucky_element,
        "persona_description": result.persona_description,
        "destiny_description": result.destiny_description,
        "axes_data": json.loads(result.axes_data) if result.axes_data else None,
        "created_at": result.created_at.isoformat(),
    }


@router.get("/month/{year}/{month}")
def get_calendar_month(
    year: int = Path(..., ge=1950, le=2100),
    month: int = Path(..., ge=1, le=12),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """특정 월의 분석 결과 목록 조회"""
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"

    results = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.username == current_user.username,
            models.AnalysisResult.analysis_date >= start_date,
            models.AnalysisResult.analysis_date < end_date,
        )
        .all()
    )

    calendar_data = {}
    for result in results:
        calendar_data[result.analysis_date] = {
            "has_analysis": True,
            "my_persona": result.my_persona,
            "lucky_element": result.lucky_element,
        }

    return {"year": year, "month": month, "data": calendar_data}
