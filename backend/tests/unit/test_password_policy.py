"""Política de contraseñas y nombre (espejo de frontend/src/lib/validation.ts)."""

import pytest
from pydantic import ValidationError

from app.schemas import ChangePasswordIn, UserCreate
from app.schemas.auth import (
    FULL_NAME_TOO_LONG,
    PASSWORD_EDGE_SPACES,
    PASSWORD_NEEDS_DIGIT,
    PASSWORD_NEEDS_LETTER,
    PASSWORD_SAME_AS_CURRENT,
    PASSWORD_TOO_LONG,
    PASSWORD_TOO_SHORT,
    check_password_policy,
)


@pytest.mark.unit
@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("abc1234", PASSWORD_TOO_SHORT),
        ("abcd1234", PASSWORD_TOO_SHORT),
        ("a1" * 37, PASSWORD_TOO_LONG),
        ("123456789", PASSWORD_NEEDS_LETTER),
        ("abcdefghi", PASSWORD_NEEDS_DIGIT),
        (" abcd12345", PASSWORD_EDGE_SPACES),
        ("abcd12345 ", PASSWORD_EDGE_SPACES),
    ],
)
def test_password_policy_rejects(password, message):
    with pytest.raises(ValueError, match=message):
        check_password_policy(password)


@pytest.mark.unit
@pytest.mark.parametrize("password", ["abcde1234", "TestPass1234", "clave con espacio 9", "a1" * 36])
def test_password_policy_accepts(password):
    assert check_password_policy(password) == password


@pytest.mark.unit
def test_multibyte_password_counts_bytes_not_chars():
    # 36 "ñ" = 72 bytes + 1 dígito = 73 bytes: supera el límite de bcrypt aunque sean 37 caracteres.
    with pytest.raises(ValueError, match=PASSWORD_TOO_LONG):
        check_password_policy("ñ" * 36 + "1")


@pytest.mark.unit
def test_full_name_is_trimmed_and_bounded():
    user = UserCreate(email="n@example.com", password="abcde1234", full_name="  Ana Pérez  ")
    assert user.full_name == "Ana Pérez"
    with pytest.raises(ValidationError, match=FULL_NAME_TOO_LONG):
        UserCreate(email="n@example.com", password="abcde1234", full_name="x" * 101)


@pytest.mark.unit
def test_change_password_rejects_same_password():
    with pytest.raises(ValidationError, match=PASSWORD_SAME_AS_CURRENT):
        ChangePasswordIn(current_password="abcde1234", new_password="abcde1234")
