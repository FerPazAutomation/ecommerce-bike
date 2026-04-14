"""
Tests del servicio de auth sin HTTP: misma BD en memoria que integration (fixture db_session).

Ejecutar solo unitarios: pytest tests/unit -m unit
"""

import pytest

from app.models import User
from app.schemas import UserCreate, UserLogin
from app.services.auth_service import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    authenticate_user,
    register_user,
)


@pytest.mark.unit
def test_register_user_persists_user(db_session):
    body = UserCreate(email="u@example.com", password="secret12", full_name="Test User")
    user = register_user(db_session, body)

    assert user.id is not None
    assert user.email == "u@example.com"
    assert user.full_name == "Test User"


@pytest.mark.unit
def test_register_user_raises_if_email_exists(db_session):
    body = UserCreate(email="dup@example.com", password="secret12", full_name="A")
    register_user(db_session, body)

    with pytest.raises(EmailAlreadyRegisteredError):
        register_user(db_session, body)


@pytest.mark.unit
def test_authenticate_user_returns_user_when_credentials_ok(db_session):
    register_user(
        db_session,
        UserCreate(email="login@example.com", password="goodpass99", full_name="L"),
    )
    user = authenticate_user(
        db_session,
        UserLogin(email="login@example.com", password="goodpass99"),
    )
    assert user.email == "login@example.com"


@pytest.mark.unit
def test_authenticate_user_raises_invalid_credentials(db_session):
    register_user(
        db_session,
        UserCreate(email="x@example.com", password="rightpass1", full_name="X"),
    )
    with pytest.raises(InvalidCredentialsError):
        authenticate_user(
            db_session,
            UserLogin(email="x@example.com", password="wrongpass1"),
        )


@pytest.mark.unit
def test_authenticate_user_raises_inactive(db_session):
    user = register_user(
        db_session,
        UserCreate(email="off@example.com", password="secret12", full_name="Off"),
    )
    user.is_active = False
    db_session.add(user)
    db_session.commit()

    with pytest.raises(InactiveUserError):
        authenticate_user(
            db_session,
            UserLogin(email="off@example.com", password="secret12"),
        )
