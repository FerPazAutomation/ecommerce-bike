/**
 * Checkout: pide a la API una URL de Stripe Checkout (sandbox) y redirige el navegador.
 *
 * Por qué redirect: en modo test, Stripe hospeda el formulario de pago (menos superficie PCI en tu backend).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { StockDialog } from "../components/StockDialog";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../lib/formatPrice";
import { STOCK_WARNING_TEXT, cartHasStockIssues, isCheckoutStockError } from "../lib/stock";
import type { CartResponse, CheckoutResponse } from "../types";

export function CheckoutPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart", token],
    queryFn: () => apiFetch<CartResponse>("/cart"),
    enabled: !!token,
  });

  const pay = useMutation({
    mutationFn: () => apiFetch<CheckoutResponse>("/orders/checkout", { method: "POST" }),
    onSuccess: (res) => {
      if (res.checkout_url) window.location.href = res.checkout_url;
    },
    onError: (err) => {
      if (!isCheckoutStockError(err)) return;
      setStockDialogOpen(true);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const isEmpty = !cart || cart.items.length === 0;
  const hasStockIssues = cartHasStockIssues(cart);
  const payErrorMessage = pay.isError && !isCheckoutStockError(pay.error) ? (pay.error as Error).message : null;

  return (
    <div className="container" style={{ maxWidth: "520px" }}>
      <h1>Checkout</h1>

      {hasStockIssues && (
        <p className="form-alert" role="alert">
          {STOCK_WARNING_TEXT} <Link to="/carrito">Ir al carrito</Link>
        </p>
      )}

      {isLoading ? (
        <p>Cargando resumen…</p>
      ) : isEmpty ? (
        <p>
          Tu carrito está vacío. <Link to="/productos">Explorar productos</Link>
        </p>
      ) : (
        <section className="card" aria-labelledby="checkout-summary-title" style={{ marginTop: "1rem" }}>
          <h2 id="checkout-summary-title" style={{ fontSize: "1.1rem", marginTop: 0 }}>
            Resumen del pedido
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {cart.items.map((line) => (
              <li
                key={line.id}
                style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.35rem 0" }}
              >
                <span>
                  {line.product.name} ×{line.quantity}
                </span>
                <span>{formatPrice(line.line_total)}</span>
              </li>
            ))}
          </ul>
          <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 0 }}>
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </p>
        </section>
      )}

      <p style={{ color: "var(--muted)" }}>
        Serás redirigido a Stripe (modo prueba) para completar el pago. Asegúrate de tener{" "}
        <code>STRIPE_SECRET_KEY</code> configurada en el backend.
      </p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: "1rem" }}
        disabled={pay.isPending || isLoading || isEmpty || hasStockIssues}
        onClick={() => pay.mutate()}
      >
        {pay.isPending ? "Preparando pago…" : "Pagar con Stripe"}
      </button>
      {payErrorMessage && (
        <p className="form-alert" role="alert">
          {payErrorMessage}
        </p>
      )}
      <StockDialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} />
      <p style={{ marginTop: "1rem" }}>
        <Link to="/carrito">Volver al carrito</Link>
      </p>
    </div>
  );
}
