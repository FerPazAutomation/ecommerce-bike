/**
 * Estado de stock que muestra la UI. La regla de "stock suficiente" vive en la API
 * (`has_enough_stock` en cada línea del carrito); el front solo la refleja.
 */

import type { CartItem, Product } from "../types";

export const OUT_OF_STOCK_LABEL = "Sin stock";

export const STOCK_WARNING_TEXT =
  "Uno o más productos de tu carrito ya no tienen stock suficiente. Revisá tu carrito.";

/** `detail` del 409 de `POST /orders/checkout` (backend/app/services/stock.py). */
export const CHECKOUT_STOCK_DETAIL = "Not enough stock for some cart items";

type StockLine = Pick<CartItem, "has_enough_stock"> & { product: Pick<Product, "stock"> };

export function isOutOfStock(stock: number): boolean {
  return stock <= 0;
}

export function cartLineStockLabel(line: StockLine): string | null {
  if (line.has_enough_stock) return null;
  if (isOutOfStock(line.product.stock)) return OUT_OF_STOCK_LABEL;
  return `Stock insuficiente: quedan ${line.product.stock}`;
}

export function cartHasStockIssues(cart: { items: Pick<CartItem, "has_enough_stock">[] } | undefined): boolean {
  return cart?.items.some((item) => !item.has_enough_stock) ?? false;
}

export function isCheckoutStockError(error: unknown): boolean {
  return error instanceof Error && error.message === CHECKOUT_STOCK_DETAIL;
}
