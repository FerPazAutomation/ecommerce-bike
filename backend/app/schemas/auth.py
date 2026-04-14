from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""

    @field_validator("email")
    @classmethod
    def email_format_and_normalize(cls, v: str) -> str:
        v = (v or "").strip()
        try:
            info = validate_email(v, check_deliverability=False)
            return info.normalized
        except EmailNotValidError:
            raise ValueError("Introduce un correo electrónico válido") from None

    @field_validator("password")
    @classmethod
    def password_longer_than_eight(cls, v: str) -> str:
        if len(v) <= 8:
            raise ValueError("La contraseña debe tener más de 8 caracteres") from None
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_longer_than_eight(cls, v: str) -> str:
        if len(v) <= 8:
            raise ValueError("La contraseña debe tener más de 8 caracteres") from None
        return v
