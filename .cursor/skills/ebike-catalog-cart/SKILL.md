---
name: ebike-catalog-cart
description: Criterios para mejorar catálogo, detalle de producto, carrito y checkout del e-commerce e-bike (filtros, búsqueda, precios Decimal, stock, cantidades, Stripe sandbox). Usar cuando se trabaje en ProductsPage, ProductDetailPage, CartPage, CheckoutPage o en los endpoints /products, /cart y /orders de e-bike.
---

# Catálogo, carrito y checkout en e-bike

Seguir primero `ebike-feature-workflow`. Para sesión y rutas protegidas, ver `ebike-auth-ux`.

## Piezas actuales

| Flujo | Front | API |
|-------|-------|-----|
| Listado + búsqueda + filtro | `pages/ProductsPage.tsx`, `components/ProductSearchField.tsx`, `hooks/useDebouncedValue.ts` | `GET /products?q=&category_slug=` |
| Detalle | `pages/ProductDetailPage.tsx` | `GET /products/{slug}` |
| Carrito | `pages/CartPage.tsx`, `components/CartIcon.tsx` | `GET /cart`, `POST/PATCH/DELETE /cart/items` |
| Checkout | `pages/CheckoutPage.tsx`, `CheckoutSuccessPage`, `CheckoutCancelPage` | `POST /orders/checkout`, webhook Stripe |

## Precios (regla crítica)

- La API envía precios y totales como **string** (vienen de `Decimal`): `"689.00"`, `subtotal: "0"`.
- Nunca sumar precios en el front para mostrar totales: usar `line_total` y `subtotal` de la API.
- Formateo **único** en `frontend/src/lib/formatPrice.ts` con `Intl.NumberFormat` (hoy hay `toFixed(2)` repetido en `AccountPage.tsx`); reemplazar los usos al tocarlos.

## Checklist de catálogo

- [ ] Filtros y búsqueda reflejados en la URL (`?categoria=`, `?q=`) para compartir y volver atrás.
- [ ] Estados de carga (skeleton o "Cargando…"), error con reintento y vacío con sugerencia.
- [ ] Tarjeta de producto: imagen con `alt`, nombre, precio formateado, link al detalle.
- [ ] Producto sin stock: visible pero con "Sin stock" y botón deshabilitado.

## Checklist de carrito

- [ ] Cantidad con límites (mínimo 1, máximo el stock) y feedback si la API rechaza.
- [ ] Acciones (agregar, cambiar cantidad, quitar) invalidan `["cart"]` para refrescar ícono y página.
- [ ] Carrito vacío con CTA a `/productos`.
- [ ] Sin sesión: mandar a login con retorno al carrito (ver `ebike-auth-ux`).

## Checklist de checkout

- [ ] Resumen del pedido antes de pagar (ítems, subtotal).
- [ ] Botón de pago deshabilitado mientras se crea la sesión Stripe; error visible si falta `STRIPE_SECRET_KEY`.
- [ ] Success y cancel explican qué pasó y qué sigue (ver pedido en `/cuenta`, volver al carrito).
- [ ] El estado "pagado" lo decide **solo** el webhook del backend; el front no marca pedidos como pagados.

## Testeabilidad

- El estado del carrito es por usuario: los tests que lo modifican usan un usuario nuevo (`uniqueRegisterUser()`), no `demo`.
- Botones con nombre accesible estable: hoy son "Añadir al carrito" (detalle), "Quitar" (carrito) y "Pagar con Stripe" (checkout). No renombrarlos sin avisar.
- Stripe real en E2E es frágil: cubrir hasta la creación de `checkout_url` por API y dejar el pago manual.
