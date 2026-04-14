import { Link, useSearchParams } from "react-router-dom";

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="container" style={{ maxWidth: "520px" }}>
      <h1>Pago iniciado</h1>
      <p style={{ color: "var(--muted)" }}>
        Si usaste Stripe test, el pedido pasará a <strong>pagado</strong> cuando el webhook confirme el evento
        (requiere <code>stripe listen</code> o despliegue con URL pública).
      </p>
      {sessionId && (
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Session: <code>{sessionId}</code>
        </p>
      )}
      <p style={{ marginTop: "1rem" }}>
        <Link to="/productos">Seguir comprando</Link>
      </p>
    </div>
  );
}
