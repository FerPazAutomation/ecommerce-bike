"""Seed: el casco de demo queda sin stock en cada corrida, sin tocar el resto ni duplicar."""

from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.models import Category, Product
from scripts.seed import OUT_OF_STOCK_DEMO_SLUG, ensure_out_of_stock_demo_product


def _product(cat: Category, slug: str, stock: int) -> Product:
    return Product(
        category_id=cat.id,
        name=slug,
        slug=slug,
        description="",
        price=Decimal("99.00"),
        stock=stock,
        is_active=True,
    )


@pytest.mark.integration
def test_seed_sets_demo_helmet_out_of_stock_idempotently(db_session: Session):
    cat = Category(slug="cascos", name="Cascos", description="")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    db_session.add_all([_product(cat, OUT_OF_STOCK_DEMO_SLUG, 11), _product(cat, "casco-linea-01", 5)])
    db_session.commit()

    assert ensure_out_of_stock_demo_product(db_session) is True
    db_session.commit()
    assert ensure_out_of_stock_demo_product(db_session) is True
    db_session.commit()

    stock_by_slug = {p.slug: p.stock for p in db_session.query(Product).all()}
    assert stock_by_slug == {OUT_OF_STOCK_DEMO_SLUG: 0, "casco-linea-01": 5}


@pytest.mark.integration
def test_seed_without_demo_helmet_returns_false(db_session: Session):
    assert OUT_OF_STOCK_DEMO_SLUG == "casco-linea-08"
    assert ensure_out_of_stock_demo_product(db_session) is False
    assert db_session.query(Product).count() == 0
