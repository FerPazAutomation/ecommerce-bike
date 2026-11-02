"""Regla de stock suficiente por línea del carrito (la comparten el carrito y el checkout)."""

import pytest

from app.services.stock import has_enough_stock


@pytest.mark.unit
@pytest.mark.parametrize(
    ("stock", "quantity"),
    [
        (3, 3),
        (5, 2),
        (1, 1),
    ],
)
def test_has_enough_stock_when_stock_covers_quantity(stock, quantity):
    assert has_enough_stock(stock, quantity) is True


@pytest.mark.unit
@pytest.mark.parametrize(
    ("stock", "quantity"),
    [
        (2, 3),
        (0, 1),
        (-1, 1),
        (0, 0),
        (-2, -3),
    ],
)
def test_has_not_enough_stock_when_short_or_out_of_stock(stock, quantity):
    assert has_enough_stock(stock, quantity) is False
