from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from collections import Counter
import json
import os
import uuid
import io
import csv

from database import get_db
from core.security import get_admin_user
import models
import schemas

router = APIRouter(prefix="/api/admin", tags=["관리자"])

# 이미지 저장 경로
IMAGES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "static", "images"
)

# 허용된 이미지 확장자
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}


# --- 이미지 관리 ---


@router.get("/images")
def admin_get_images(
    admin_user: models.User = Depends(get_admin_user),
):
    """이미지 목록 조회"""
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    images = []
    for filename in os.listdir(IMAGES_DIR):
        filepath = os.path.join(IMAGES_DIR, filename)
        if os.path.isfile(filepath):
            ext = os.path.splitext(filename)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                stat = os.stat(filepath)
                images.append(
                    {
                        "filename": filename,
                        "url": f"/static/images/{filename}",
                        "size": stat.st_size,
                        "created_at": stat.st_ctime,
                    }
                )

    # 최신순 정렬
    images.sort(key=lambda x: x["created_at"], reverse=True)

    return {"images": images, "total": len(images)}


@router.post("/images")
async def admin_upload_image(
    file: UploadFile = File(...),
    admin_user: models.User = Depends(get_admin_user),
):
    """이미지 업로드"""
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    # 파일 확장자 검증
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # 파일 크기 검증 (5MB 제한)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="파일 크기는 5MB를 초과할 수 없습니다."
        )

    # 고유한 파일명 생성
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(IMAGES_DIR, unique_filename)

    # 파일 저장
    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "message": "이미지가 업로드되었습니다.",
        "filename": unique_filename,
        "url": f"/static/images/{unique_filename}",
    }


@router.delete("/images/{filename}")
def admin_delete_image(
    filename: str,
    admin_user: models.User = Depends(get_admin_user),
):
    """이미지 삭제"""
    # 보안: 경로 조작 방지
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="잘못된 파일명입니다.")

    filepath = os.path.join(IMAGES_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

    if not os.path.isfile(filepath):
        raise HTTPException(status_code=400, detail="잘못된 요청입니다.")

    os.remove(filepath)

    return {"message": "이미지가 삭제되었습니다.", "filename": filename}


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


@router.get("/celebrities/export")
def admin_export_celebrities(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 목록 CSV 내보내기"""
    celebrities = db.query(models.MbtiCelebrity).order_by(models.MbtiCelebrity.id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV 헤더
    writer.writerow(["id", "mbti", "name", "tags", "description", "image_url"])

    for celeb in celebrities:
        # 태그는 JSON 문자열 그대로 내보내거나, 보기 좋게 가공 가능 (여기선 원본 유지)
        writer.writerow(
            [
                celeb.id,
                celeb.mbti,
                celeb.name,
                celeb.tags,  # DB에 저장된 JSON 문자열 그대로
                celeb.description,
                celeb.image_url,
            ]
        )

    output.seek(0)

    # 한글 깨짐 방지를 위해 BOM(utf-8-sig) 추가
    response = StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]), media_type="text/csv"
    )
    response.headers["Content-Disposition"] = (
        "attachment; filename=celebrities_export.csv"
    )
    return response


@router.post("/celebrities/import")
async def admin_import_celebrities(
    file: UploadFile = File(...),
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """유명인 목록 CSV 가져오기 (대량 등록/수정)"""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")

    content = await file.read()
    # utf-8-sig로 디코딩하여 BOM 처리
    decoded = content.decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(decoded))

    success_count = 0
    errors = []

    for row in reader:
        try:
            # 필수 필드 확인
            if not row.get("mbti") or not row.get("name"):
                continue

            # MBTI 대문자 변환
            mbti = row["mbti"].strip().upper()
            if len(mbti) != 4:
                continue

            # 태그 처리 (JSON 파싱 시도, 실패 시 리스트로 변환)
            tags_str = row.get("tags", "[]")
            try:
                # 이미 JSON 형식이면 유효성만 체크
                json.loads(tags_str)
                tags = tags_str
            except json.JSONDecodeError:
                # 일반 문자열이면 콤마로 구분된 태그로 간주
                tags_list = [t.strip() for t in tags_str.split(",") if t.strip()]
                tags = json.dumps(tags_list, ensure_ascii=False)

            # ID가 있으면 수정 시도, 없으면 추가
            celeb_id = row.get("id")
            existing = None

            if celeb_id:
                existing = (
                    db.query(models.MbtiCelebrity)
                    .filter(models.MbtiCelebrity.id == celeb_id)
                    .first()
                )

            # 이름과 MBTI로 중복 체크 (ID가 없을 경우)
            if not existing:
                existing = (
                    db.query(models.MbtiCelebrity)
                    .filter(
                        models.MbtiCelebrity.mbti == mbti,
                        models.MbtiCelebrity.name == row["name"],
                    )
                    .first()
                )

            if existing:
                # 업데이트
                existing.mbti = mbti
                existing.name = row["name"]
                existing.tags = tags
                existing.description = row.get("description", "")
                existing.image_url = row.get("image_url", "")
            else:
                # 신규 생성
                new_celeb = models.MbtiCelebrity(
                    mbti=mbti,
                    name=row["name"],
                    tags=tags,
                    description=row.get("description", ""),
                    image_url=row.get("image_url", ""),
                )
                db.add(new_celeb)

            success_count += 1

        except Exception as e:
            errors.append(f"{row.get('name', 'Unknown')}: {str(e)}")

    db.commit()

    return {"message": f"{success_count}건 처리 완료", "errors": errors}


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
