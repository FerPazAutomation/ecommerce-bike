import { Link } from "react-router-dom";

export function CheckoutCancelPage() {
  return (
    <div className="container" style={{ maxWidth: "520px" }}>
      <h1>Pago cancelado</h1>
      <p style={{ color: "var(--muted)" }}>No se completó el checkout. Tu carrito sigue disponible.</p>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/carrito">Volver al carrito</Link>
      </p>
    </div>
  );
}
