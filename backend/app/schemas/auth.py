from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, EmailStr, field_validator, model_validator

# Política de contraseñas y nombre. Espejo en `frontend/src/lib/validation.ts`:
# si cambia una regla o un mensaje, cambiarlo en los dos lados.
PASSWORD_MIN_EXCLUSIVE = 8
PASSWORD_MAX_BYTES = 72  # bcrypt ignora o rechaza lo que pasa de 72 bytes
FULL_NAME_MAX = 100

PASSWORD_TOO_SHORT = "La contraseña debe tener más de 8 caracteres"
PASSWORD_TOO_LONG = "La contraseña no puede superar los 72 caracteres"
PASSWORD_NEEDS_LETTER = "La contraseña debe incluir al menos una letra"
PASSWORD_NEEDS_DIGIT = "La contraseña debe incluir al menos un número"
PASSWORD_EDGE_SPACES = "La contraseña no puede empezar ni terminar con espacios"
PASSWORD_SAME_AS_CURRENT = "La nueva contraseña debe ser distinta de la actual"
FULL_NAME_TOO_LONG = "El nombre no puede superar los 100 caracteres"


def check_password_policy(v: str) -> str:
    if len(v) <= PASSWORD_MIN_EXCLUSIVE:
        raise ValueError(PASSWORD_TOO_SHORT)
    if len(v.encode("utf-8")) > PASSWORD_MAX_BYTES:
        raise ValueError(PASSWORD_TOO_LONG)
    if not any(c.isalpha() for c in v):
        raise ValueError(PASSWORD_NEEDS_LETTER)
    if not any(c.isdecimal() for c in v):
        raise ValueError(PASSWORD_NEEDS_DIGIT)
    if v != v.strip():
        raise ValueError(PASSWORD_EDGE_SPACES)
    return v


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
    def password_policy(cls, v: str) -> str:
        return check_password_policy(v)

    @field_validator("full_name")
    @classmethod
    def full_name_trimmed_and_bounded(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) > FULL_NAME_MAX:
            raise ValueError(FULL_NAME_TOO_LONG)
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
    def new_password_policy(cls, v: str) -> str:
        return check_password_policy(v)

    @model_validator(mode="after")
    def new_differs_from_current(self) -> "ChangePasswordIn":
        if self.new_password == self.current_password:
            raise ValueError(PASSWORD_SAME_AS_CURRENT)
        return self
