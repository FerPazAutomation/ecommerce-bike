"""
Registro y login: el login devuelve un JWT que el cliente debe guardar y enviar en Authorization.

Por qué email en `sub`: identificador estable para buscar el usuario en cada petición protegida.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.database import get_db
from app.models import User
from app.schemas import ChangePasswordIn, ForgotPasswordIn, Token, UserCreate, UserLogin, UserOut
from app.services.auth_service import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    WrongCurrentPasswordError,
    authenticate_user,
    change_user_password,
    register_user,
)

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(body: UserCreate, db: Session = Depends(get_db)) -> User:
    try:
        return register_user(db, body)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya está registrado. Inicia sesión o usa otro email.",
        ) from None


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)) -> Token:
    try:
        user = authenticate_user(db, body)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        ) from None
    except InactiveUserError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user") from None
    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/change-password")
def change_password(
    body: ChangePasswordIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    try:
        change_user_password(
            db,
            user,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except WrongCurrentPasswordError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta.",
        ) from None
    return {"message": "Contraseña actualizada correctamente."}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)) -> dict[str, str]:
    """
    Respuesta genérica para no revelar si el email existe.
    En producción: enviar correo con enlace de restablecimiento (token de un solo uso).
    """
    _ = db.query(User).filter(User.email == body.email).first()
    return {
        "message": (
            "Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña."
        ),
    }
