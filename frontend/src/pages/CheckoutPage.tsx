/**
 * Checkout: pide a la API una URL de Stripe Checkout (sandbox) y redirige el navegador.
 *
 * Por qué redirect: en modo test, Stripe hospeda el formulario de pago (menos superficie PCI en tu backend).
 */

import { useMutation } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { apiFetch, getToken } from "../api/client";
import type { CheckoutResponse } from "../types";

export function CheckoutPage() {
  const token = getToken();

  const pay = useMutation({
    mutationFn: () => apiFetch<CheckoutResponse>("/orders/checkout", { method: "POST" }),
    onSuccess: (res) => {
      if (res.checkout_url) window.location.href = res.checkout_url;
    },
  });

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="container" style={{ maxWidth: "520px" }}>
      <h1>Checkout</h1>
      <p style={{ color: "var(--muted)" }}>
        Serás redirigido a Stripe (modo prueba) para completar el pago. Asegúrate de tener{" "}
        <code>STRIPE_SECRET_KEY</code> configurada en el backend.
      </p>
      <button type="button" className="btn" style={{ marginTop: "1rem" }} disabled={pay.isPending} onClick={() => pay.mutate()}>
        {pay.isPending ? "Preparando pago…" : "Pagar con Stripe"}
      </button>
      {pay.isError && (
        <p style={{ color: "var(--danger)", marginTop: "0.75rem" }}>{(pay.error as Error).message}</p>
      )}
      <p style={{ marginTop: "1rem" }}>
        <Link to="/carrito">Volver al carrito</Link>
      </p>
    </div>
  );
}
