from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_current_user, verify_password, get_password_hash
import models
import schemas

router = APIRouter(prefix="/api/users", tags=["사용자"])


def validate_birthdate(date_str: str):
    """생년월일 유효성 검사"""
    try:
        year = int(date_str.split("-")[0])
        if not (1950 <= year <= 2050):
            raise ValueError
    except:
        raise HTTPException(
            status_code=400,
            detail="생년월일은 1950~2050년 사이여야 합니다.",
        )


@router.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """내 정보 조회"""
    return {
        "username": current_user.username,
        "nickname": current_user.nickname,
        "birthdate": current_user.birthdate,
        "gender": current_user.gender,
    }


@router.put("/profile")
def update_profile(
    info: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """프로필 수정"""
    validate_birthdate(info.birthdate)

    current_user.nickname = info.nickname
    current_user.birthdate = info.birthdate
    current_user.gender = info.gender

    db.commit()
    db.refresh(current_user)

    return {"message": "프로필 업데이트 완료"}


@router.put("/password")
def change_password(
    pw_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """비밀번호 변경"""
    if not verify_password(pw_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="기존 비밀번호 불일치")

    current_user.hashed_password = get_password_hash(pw_data.new_password)
    db.commit()

    return {"message": "비밀번호 변경 완료"}


@router.delete("/me")
def delete_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """계정 삭제"""
    db.delete(current_user)
    db.commit()
    return {"message": "계정 삭제 완료"}
