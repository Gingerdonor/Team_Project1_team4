from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from collections import Counter

from database import get_db
import models

router = APIRouter(prefix="/api/stats", tags=["통계"])


def counter_to_stats(counter: Counter, total: int) -> dict:
    """Counter를 통계 딕셔너리로 변환"""
    return {
        item: {
            "count": count,
            "percent": round((count / total) * 100, 1) if total > 0 else 0,
        }
        for item, count in counter.most_common()
    }


def calculate_axes_stats(results: list) -> dict:
    """MBTI 축별 통계 계산"""
    axes_counts = {
        "E_I": {"E": 0, "I": 0},
        "S_N": {"S": 0, "N": 0},
        "T_F": {"T": 0, "F": 0},
        "J_P": {"J": 0, "P": 0},
    }

    for result in results:
        if result.my_persona and len(result.my_persona) == 4:
            mbti = result.my_persona
            axes_counts["E_I"][mbti[0]] = axes_counts["E_I"].get(mbti[0], 0) + 1
            axes_counts["S_N"][mbti[1]] = axes_counts["S_N"].get(mbti[1], 0) + 1
            axes_counts["T_F"][mbti[2]] = axes_counts["T_F"].get(mbti[2], 0) + 1
            axes_counts["J_P"][mbti[3]] = axes_counts["J_P"].get(mbti[3], 0) + 1

    axes_stats = {}
    for axis_key, axis_data in axes_counts.items():
        total = sum(axis_data.values())
        axes_stats[axis_key] = {}
        for char, count in axis_data.items():
            axes_stats[axis_key][char] = count
            axes_stats[axis_key][f"{char}_percent"] = (
                round((count / total) * 100, 1) if total > 0 else 0
            )

    return axes_stats


@router.get("/monthly")
def get_monthly_stats(
    year: int = Query(default=None, ge=1950, le=2100),
    month: int = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """월간 통계 조회"""
    if year is None:
        year = date.today().year
    if month is None:
        month = date.today().month

    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month + 1:02d}-01"

    results = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.analysis_date >= start_date,
            models.AnalysisResult.analysis_date < end_date,
        )
        .all()
    )

    if not results:
        return {
            "year": year,
            "month": month,
            "total_analyses": 0,
            "unique_users": 0,
            "persona_stats": {},
            "destiny_stats": {},
            "axes_stats": {
                "E_I": {"E": 0, "I": 0, "E_percent": 0, "I_percent": 0},
                "S_N": {"S": 0, "N": 0, "S_percent": 0, "N_percent": 0},
                "T_F": {"T": 0, "F": 0, "T_percent": 0, "F_percent": 0},
                "J_P": {"J": 0, "P": 0, "J_percent": 0, "P_percent": 0},
            },
            "top_persona": None,
            "top_destiny": None,
            "element_stats": {},
        }

    total_analyses = len(results)
    unique_users = len(set(r.username for r in results))

    persona_counter = Counter(r.my_persona for r in results if r.my_persona)
    destiny_counter = Counter(r.my_destiny for r in results if r.my_destiny)
    element_counter = Counter(r.lucky_element for r in results if r.lucky_element)

    top_persona = persona_counter.most_common(1)[0] if persona_counter else None
    top_destiny = destiny_counter.most_common(1)[0] if destiny_counter else None

    return {
        "year": year,
        "month": month,
        "total_analyses": total_analyses,
        "unique_users": unique_users,
        "persona_stats": counter_to_stats(persona_counter, total_analyses),
        "destiny_stats": counter_to_stats(destiny_counter, total_analyses),
        "axes_stats": calculate_axes_stats(results),
        "top_persona": (
            {"mbti": top_persona[0], "count": top_persona[1]} if top_persona else None
        ),
        "top_destiny": (
            {"mbti": top_destiny[0], "count": top_destiny[1]} if top_destiny else None
        ),
        "element_stats": counter_to_stats(element_counter, total_analyses),
    }


@router.get("/all-time")
def get_all_time_stats(db: Session = Depends(get_db)):
    """전체 기간 통계 조회"""
    results = db.query(models.AnalysisResult).all()

    if not results:
        return {
            "total_analyses": 0,
            "unique_users": 0,
            "persona_stats": {},
            "destiny_stats": {},
            "axes_stats": {
                "E_I": {"E": 0, "I": 0, "E_percent": 0, "I_percent": 0},
                "S_N": {"S": 0, "N": 0, "S_percent": 0, "N_percent": 0},
                "T_F": {"T": 0, "F": 0, "T_percent": 0, "F_percent": 0},
                "J_P": {"J": 0, "P": 0, "J_percent": 0, "P_percent": 0},
            },
            "element_stats": {},
        }

    total_analyses = len(results)
    unique_users = len(set(r.username for r in results))

    persona_counter = Counter(r.my_persona for r in results if r.my_persona)
    destiny_counter = Counter(r.my_destiny for r in results if r.my_destiny)
    element_counter = Counter(r.lucky_element for r in results if r.lucky_element)

    return {
        "total_analyses": total_analyses,
        "unique_users": unique_users,
        "persona_stats": counter_to_stats(persona_counter, total_analyses),
        "destiny_stats": counter_to_stats(destiny_counter, total_analyses),
        "axes_stats": calculate_axes_stats(results),
        "element_stats": counter_to_stats(element_counter, total_analyses),
    }
