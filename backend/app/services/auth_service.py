"""
Lógica de negocio de auth (registro / credenciales), sin HTTP.

El router solo traduce excepciones de dominio a status codes.
"""

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User
from app.schemas import UserCreate, UserLogin


class EmailAlreadyRegisteredError(Exception):
    """Ya existe un usuario con ese email."""


class InvalidCredentialsError(Exception):
    """Email inexistente o contraseña incorrecta."""


class InactiveUserError(Exception):
    """Usuario deshabilitado."""


class WrongCurrentPasswordError(Exception):
    """La contraseña actual no coincide."""


def register_user(db: Session, body: UserCreate) -> User:
    if db.query(User).filter(User.email == body.email).first():
        raise EmailAlreadyRegisteredError
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: User, *, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise WrongCurrentPasswordError
    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()


def authenticate_user(db: Session, body: UserLogin) -> User:
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise InvalidCredentialsError
    if not user.is_active:
        raise InactiveUserError
    return user
