import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../lib/formatPrice";
import type { CartResponse } from "../types";

export function CartPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cart", token],
    queryFn: () => apiFetch<CartResponse>("/cart"),
    enabled: !!token,
  });

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiFetch(`/cart/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/cart/items/${id}`, { method: "DELETE" }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <div className="container">Cargando carrito…</div>;
  if (error) {
    return (
      <div className="container" style={{ maxWidth: "640px" }}>
        <h1>Carrito</h1>
        <p className="form-alert" role="alert">
          No pudimos cargar tu carrito: {(error as Error).message}
        </p>
        <button type="button" className="btn-ghost" style={{ marginTop: "0.75rem" }} onClick={() => refetch()}>
          Reintentar
        </button>
      </div>
    );
  }
  if (!data) return null;

  const mutationError = (update.error ?? remove.error) as Error | null;

  return (
    <div className="container" style={{ maxWidth: "640px" }}>
      <h1>Carrito</h1>
      {data.items.length === 0 ? (
        <p>
          Tu carrito está vacío. <Link to="/productos">Explorar productos</Link>
        </p>
      ) : (
        <>
          {mutationError ? (
            <p className="form-alert" role="alert">
              {mutationError.message}
            </p>
          ) : null}
          <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
            {data.items.map((line) => (
              <li key={line.id} className="card" style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <Link to={`/productos/${line.product.slug}`} style={{ fontWeight: 600 }}>
                      {line.product.name}
                    </Link>
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                      {formatPrice(line.product.price)} c/u
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      key={`${line.id}-${line.quantity}`}
                      type="number"
                      min={1}
                      max={line.product.stock}
                      className="input"
                      style={{ width: "72px" }}
                      aria-label={`Cantidad de ${line.product.name}`}
                      defaultValue={line.quantity}
                      disabled={update.isPending}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isNaN(n) || n < 1) {
                          e.target.value = String(line.quantity);
                          return;
                        }
                        if (n !== line.quantity) update.mutate({ id: line.id, quantity: n });
                      }}
                    />
                    <span>{formatPrice(line.line_total)}</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(line.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            Subtotal: <span style={{ color: "var(--accent)" }}>{formatPrice(data.subtotal)}</span>
          </p>
          <Link to="/checkout" className="btn" style={{ display: "inline-flex", marginTop: "1rem" }}>
            Ir al checkout
          </Link>
        </>
      )}
    </div>
  );
}
