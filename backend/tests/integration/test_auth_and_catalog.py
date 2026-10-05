"""
Tests de integración: registro, login, recuperación de contraseña, catálogo y búsqueda.

Las fixtures `client` y `db_session` vienen de `tests/conftest.py` (SQLite en memoria, una BD por test).
"""

import pytest
from sqlalchemy.orm import Session

from app.models import Category, Product


@pytest.mark.integration
def test_register_and_login(client):
    r = client.post(
        "/auth/register",
        json={"email": "u@test.com", "password": "secret123", "full_name": "U"},
    )
    assert r.status_code == 200
    r2 = client.post("/auth/login", json={"email": "u@test.com", "password": "secret123"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()
    r3 = client.post("/auth/register", json={"email": "u@test.com", "password": "secret123", "full_name": "U"})
    assert r3.status_code == 400
    assert "detail" in r3.json()
    assert r3.json()["detail"] == "Este correo ya está registrado. Inicia sesión o usa otro email."


@pytest.mark.integration
def test_forgot_password_always_ok(client):
    r = client.post("/auth/forgot-password", json={"email": "anyone@test.com"})
    assert r.status_code == 200
    assert "message" in r.json()


@pytest.mark.integration
def test_change_password(client):
    client.post(
        "/auth/register",
        json={"email": "cp@test.com", "password": "oldsecret9", "full_name": "CP"},
    )
    r = client.post("/auth/login", json={"email": "cp@test.com", "password": "oldsecret9"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r2 = client.post(
        "/auth/change-password",
        json={"current_password": "oldsecret9", "new_password": "newsecret9"},
        headers=headers,
    )
    assert r2.status_code == 200
    assert client.post("/auth/login", json={"email": "cp@test.com", "password": "oldsecret9"}).status_code == 401
    assert client.post("/auth/login", json={"email": "cp@test.com", "password": "newsecret9"}).status_code == 200

    
@pytest.mark.integration
def test_change_password_rejects_wrong_current(client):
    client.post(
        "/auth/register",
        json={"email": "cw@test.com", "password": "secret129", "full_name": "CW"},
    )
    r = client.post("/auth/login", json={"email": "cw@test.com", "password": "secret129"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r2 = client.post(
        "/auth/change-password",
        json={"current_password": "nope99999", "new_password": "othersecret9"},
        headers=headers,
    )
    assert r2.status_code == 400


@pytest.mark.integration
def test_change_password_rejects_same_as_current(client):
    client.post(
        "/auth/register",
        json={"email": "same@test.com", "password": "secret129", "full_name": "S"},
    )
    r = client.post("/auth/login", json={"email": "same@test.com", "password": "secret129"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r2 = client.post(
        "/auth/change-password",
        json={"current_password": "secret129", "new_password": "secret129"},
        headers=headers,
    )
    assert r2.status_code == 422
    assert "distinta de la actual" in r2.text


@pytest.mark.integration
def test_login_fails_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "x@test.com", "password": "secret123", "full_name": "X"},
    )
    r = client.post("/auth/login", json={"email": "x@test.com", "password": "wrong"})
    assert r.status_code == 401


@pytest.mark.integration
def test_categories_and_products_filter(client, db_session: Session):
    cat = Category(slug="montana", name="Montaña", description="")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    db_session.add(
        Product(
            category_id=cat.id,
            name="Bike A",
            slug="bike-a",
            description="una bicicleta de prueba",
            price=100,
            stock=5,
            is_active=True,
        )
    )
    db_session.commit()

    r = client.get("/categories")
    assert r.status_code == 200
    assert len(r.json()) >= 1

    r2 = client.get("/products?q=bicicleta")
    assert r2.status_code == 200
    data = r2.json()
    assert data["total"] >= 1

    r3 = client.get("/products?category_slug=montana")
    assert r3.json()["total"] >= 1

    r4 = client.get("/products?q=bike+prueba")
    assert r4.status_code == 200
    assert r4.json()["total"] >= 1

    r5 = client.get("/products/suggestions?q=bike")
    assert r5.status_code == 200
    sug = r5.json()["items"]
    assert len(sug) >= 1
    assert all("slug" in x and "name" in x for x in sug)


    
