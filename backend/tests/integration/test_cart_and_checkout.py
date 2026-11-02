"""Carrito y checkout; Stripe se simula con mock para no llamar a la red."""

import os
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.models import CartItem, Category, Product, User
from app.core.security import hash_password


@pytest.mark.integration
def test_cart_requires_auth(client):
    r = client.get("/cart")
    assert r.status_code == 401


@pytest.mark.integration
def test_cart_flow_and_checkout_mock(client, db_session: Session):
    user = User(
        email="buyer@test.com",
        hashed_password=hash_password("pw123456"),
        full_name="Buyer",
    )
    db_session.add(user)
    cat = Category(slug="c", name="C", description="")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    p = Product(
        category_id=cat.id,
        name="E-bike",
        slug="e-bike",
        description="",
        price=Decimal("99.00"),
        stock=3,
        is_active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)

    login = client.post("/auth/login", json={"email": "buyer@test.com", "password": "pw123456"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})
    assert r.status_code == 200
    assert r.json()["quantity"] == 2
    assert r.json()["has_enough_stock"] is True

    r2 = client.get("/cart", headers=headers)
    assert r2.status_code == 200
    assert len(r2.json()["items"]) == 1
    assert r2.json()["items"][0]["has_enough_stock"] is True

    fake_session = MagicMock()
    fake_session.id = "cs_test_123"
    fake_session.url = "https://stripe.test/checkout"

    with patch.dict(
        os.environ,
        {"STRIPE_SECRET_KEY": "sk_test_fake", "FRONTEND_URL": "http://localhost:5173"},
    ):
        from app.core.config import get_settings

        get_settings.cache_clear()
        with patch("stripe.checkout.Session.create", return_value=fake_session):
            r3 = client.post("/orders/checkout", headers=headers)
    assert r3.status_code == 200
    body = r3.json()
    assert body["checkout_url"] == "https://stripe.test/checkout"
    assert "order_id" in body

    oid = body["order_id"]
    r4 = client.get(f"/orders/{oid}", headers=headers)
    assert r4.status_code == 200
    assert r4.json()["status"] == "pending"

    r_me = client.get("/auth/me", headers=headers)
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "buyer@test.com"

    r_list = client.get("/orders", headers=headers)
    assert r_list.status_code == 200
    listed = r_list.json()
    assert len(listed) >= 1
    assert any(o["id"] == oid for o in listed)


@pytest.fixture
def stripe_configured():
    with patch.dict(
        os.environ,
        {"STRIPE_SECRET_KEY": "sk_test_fake", "FRONTEND_URL": "http://localhost:5173"},
    ):
        from app.core.config import get_settings

        get_settings.cache_clear()
        yield
    get_settings.cache_clear()


def _buyer_with_product(client, db_session: Session, stock: int) -> tuple[dict, Product]:
    user = User(
        email="stock-buyer@example.com",
        hashed_password=hash_password("pw123456"),
        full_name="Stock Buyer",
    )
    db_session.add(user)
    cat = Category(slug="c", name="C", description="")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    p = Product(
        category_id=cat.id,
        name="E-bike",
        slug="e-bike",
        description="",
        price=Decimal("99.00"),
        stock=stock,
        is_active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)

    login = client.post("/auth/login", json={"email": "stock-buyer@example.com", "password": "pw123456"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    return headers, p


@pytest.mark.integration
@pytest.mark.parametrize("stock_after", [1, 0])
def test_checkout_rejects_with_409_when_stock_dropped(client, db_session: Session, stripe_configured, stock_after):
    headers, p = _buyer_with_product(client, db_session, stock=3)
    r = client.post("/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})
    assert r.status_code == 200

    p.stock = stock_after
    db_session.commit()

    cart_before = client.get("/cart", headers=headers).json()
    assert cart_before["items"][0]["has_enough_stock"] is False

    fake_session = MagicMock()
    with patch("stripe.checkout.Session.create", return_value=fake_session) as create:
        r_checkout = client.post("/orders/checkout", headers=headers)

    assert r_checkout.status_code == 409
    assert r_checkout.json() == {"detail": "Not enough stock for some cart items"}
    create.assert_not_called()
    assert client.get("/orders", headers=headers).json() == []
    assert client.get("/cart", headers=headers).json() == cart_before


@pytest.mark.integration
def test_checkout_with_quantity_equal_to_stock_returns_200(client, db_session: Session, stripe_configured):
    headers, p = _buyer_with_product(client, db_session, stock=3)
    r = client.post("/cart/items", headers=headers, json={"product_id": p.id, "quantity": 3})
    assert r.status_code == 200
    assert r.json()["has_enough_stock"] is True

    fake_session = MagicMock()
    fake_session.id = "cs_test_equal"
    fake_session.url = "https://stripe.test/checkout"
    with patch("stripe.checkout.Session.create", return_value=fake_session) as create:
        r_checkout = client.post("/orders/checkout", headers=headers)

    assert r_checkout.status_code == 200
    assert r_checkout.json()["checkout_url"] == "https://stripe.test/checkout"
    create.assert_called_once()
