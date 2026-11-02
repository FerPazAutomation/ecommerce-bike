"""
Regla de stock suficiente por línea del carrito.

Única fuente de la regla: la usan las líneas de `/cart` (`has_enough_stock`) y el checkout.
"""

CHECKOUT_STOCK_DETAIL = "Not enough stock for some cart items"


def has_enough_stock(stock: int, quantity: int) -> bool:
    return stock > 0 and stock >= quantity
