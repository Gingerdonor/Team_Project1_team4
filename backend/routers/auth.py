from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# config가 먼저 로드되도록 (database보다 앞에)
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    add_token_to_blacklist,
    oauth2_scheme,
)
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api", tags=["인증"])


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


@router.post(
    "/register",
    response_model=schemas.MessageResponse,
    summary="회원가입",
    description="새로운 사용자 계정을 생성합니다.",
    responses={
        200: {"description": "회원가입 성공"},
        400: {"description": "이미 존재하는 사용자명 또는 잘못된 생년월일"},
    },
)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    """회원가입"""
    validate_birthdate(user.birthdate)

    # 중복 검사
    existing_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")

    # 저장
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_pw,
        nickname=user.nickname,
        birthdate=user.birthdate,
        gender=user.gender,
    )
    db.add(new_user)
    db.commit()

    return {"message": "회원가입 성공"}


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="로그인",
    description="사용자 인증 후 JWT 토큰을 발급합니다.",
    responses={
        200: {"description": "로그인 성공, 토큰 발급"},
        401: {"description": "아이디 또는 비밀번호 오류"},
    },
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """로그인"""
    db_user = (
        db.query(models.User).filter(models.User.username == form_data.username).first()
    )

    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호 오류")

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/logout",
    response_model=schemas.MessageResponse,
    summary="로그아웃",
    description="현재 토큰을 무효화합니다.",
)
def logout(token: str = Depends(oauth2_scheme)):
    """로그아웃"""
    add_token_to_blacklist(token)
    return {"message": "로그아웃 성공"}
