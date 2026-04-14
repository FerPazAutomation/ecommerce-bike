import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { apiFetch, getToken } from "../api/client";
import type { CartResponse } from "../types";

export function CartPage() {
  const token = getToken();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch(`/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (!token) return <Navigate to="/login" replace />;

  if (isLoading) return <div className="container">Cargando carrito…</div>;
  if (error) return <div className="container">{(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="container" style={{ maxWidth: "640px" }}>
      <h1>Carrito</h1>
      {data.items.length === 0 ? (
        <p>
          Tu carrito está vacío. <Link to="/productos">Explorar productos</Link>
        </p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0" }}>
            {data.items.map((line) => (
              <li key={line.id} className="card" style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <Link to={`/productos/${line.product.slug}`} style={{ fontWeight: 600 }}>
                      {line.product.name}
                    </Link>
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>${line.product.price} c/u</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      min={1}
                      className="input"
                      style={{ width: "72px" }}
                      defaultValue={line.quantity}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (n >= 1 && n !== line.quantity) update.mutate({ id: line.id, quantity: n });
                      }}
                    />
                    <span>${line.line_total}</span>
                    <button type="button" className="btn-ghost" onClick={() => remove.mutate(line.id)}>
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            Subtotal: <span style={{ color: "var(--accent)" }}>${data.subtotal}</span>
          </p>
          <Link to="/checkout" className="btn" style={{ display: "inline-flex", marginTop: "1rem" }}>
            Ir al checkout
          </Link>
        </>
      )}
    </div>
  );
}
