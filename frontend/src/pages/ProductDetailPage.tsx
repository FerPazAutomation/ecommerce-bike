import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { apiFetch, getToken } from "../api/client";
import { FallbackImage } from "../components/FallbackImage";
import { productImageFallback } from "../lib/imageFallback";
import { getProductImageUrl } from "../lib/productImage";
import type { Product } from "../types";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const token = getToken();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiFetch<Product>(`/products/${slug}`, { auth: false }),
    enabled: !!slug,
  });

  const add = useMutation({
    mutationFn: () =>
      apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: data!.id, quantity: 1 }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <div className="container">Cargando…</div>;
  if (error || !data) return <div className="container">Producto no encontrado.</div>;

  const img = getProductImageUrl(data);

  return (
    <div className="container" style={{ maxWidth: "640px", paddingTop: "1.5rem" }}>
      <Link to="/productos" style={{ color: "var(--muted)" }}>
        ← Volver al catálogo
      </Link>
      <FallbackImage
        src={img}
        alt={data.name}
        fallbackSrc={productImageFallback(data.slug)}
        style={{
          width: "100%",
          maxHeight: 380,
          objectFit: "cover",
          borderRadius: "var(--radius-lg)",
          marginTop: "1rem",
          background: "var(--surface)",
        }}
      />
      <h1 style={{ marginTop: "1rem", fontFamily: "Syne, sans-serif" }}>{data.name}</h1>
      <p className="badge">{data.category_slug}</p>
      <p style={{ color: "var(--muted)", marginTop: "1rem" }}>{data.description}</p>
      <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--accent)", marginTop: "1rem" }}>
        ${data.price}
      </p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Stock: {data.stock}</p>
      {!token ? (
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Inicia sesión</Link> para añadir al carrito.
        </p>
      ) : (
        <button
          type="button"
          className="btn"
          style={{ marginTop: "1rem" }}
          disabled={data.stock < 1 || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? "Añadiendo…" : "Añadir al carrito"}
        </button>
      )}
      {add.isError && (
        <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{(add.error as Error).message}</p>
      )}
    </div>
  );
}
