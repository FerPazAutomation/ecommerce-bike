"""Registro vía POST /auth/register."""

import pytest


@pytest.mark.integration
def test_register_returns_200_and_user_payload(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "f.llanes12@gmail.com",
            "password": "pw1234567",
            "full_name": "ferpaz",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "f.llanes12@gmail.com"
    assert data["full_name"] == "ferpaz"
    assert "id" in data


@pytest.mark.integration
def test_register_rejects_short_password(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "shortpw@test.com",
            "password": "short",
            "full_name": "x",
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert "detail" in body


@pytest.mark.integration
def test_register_rejects_invalid_email(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "not-an-email",
            "password": "validpass9",
            "full_name": "x",
        },
    )
    assert response.status_code == 422


@pytest.mark.integration
def test_register_rejects_duplicate_email(client):
    payload = {
        "email": "dup@test.com",
        "password": "firstpass9",
        "full_name": "A",
    }
    assert client.post("/auth/register", json=payload).status_code == 200
    r2 = client.post(
        "/auth/register",
        json={**payload, "password": "secondpass9"},
    )
    assert r2.status_code == 400
    assert "correo" in r2.json()["detail"].lower()
