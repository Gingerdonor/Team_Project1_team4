from pydantic import BaseModel


# --- 입력 데이터 검증 모델 (Request) ---
class UserRegister(BaseModel):
    username: str
    password: str
    nickname: str
    birthdate: str
    gender: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: str
    birthdate: str
    gender: str


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# --- 응답 데이터 모델 (Response) ---
class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    username: str
    nickname: str
    birthdate: str
    gender: str
    # password는 보안상 반환하지 않음
