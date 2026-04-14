import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { apiFetch } from "../api/client";
import { FallbackImage } from "../components/FallbackImage";
import { productImageFallback } from "../lib/imageFallback";
import { getProductImageUrl } from "../lib/productImage";
import type { ProductListResponse } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  montana: "Montaña",
  ciudad: "Ciudad",
  electrica: "Eléctricas",
  cascos: "Cascos",
};

const CASCOS_INTRO_SHORT =
  "En bici compartís vía con otros usuarios y frente a un imprevisto el casco es lo que mejor reduce el riesgo de lesión grave en la cabeza. Elegí uno homologado, bien abrochado y reemplazalo si sufrió un golpe fuerte.";

const CASCOS_INTRO_FULL = (
  <>
    <p style={{ margin: "0 0 0.75rem" }}>
      Pedalear —en ciudad, sendero o con asistencia eléctrica— implica velocidad, superficies irregulares y encuentros con
      otros actores viales. Un frenazo, una raíz húmeda o un simple despiste pueden provocar una caída en segundos; por
      eso el casco no es un accesorio decorativo sino el equipo más eficaz para amortiguar el impacto contra el suelo u
      obstáculos.
    </p>
    <p style={{ margin: 0 }}>
      Lo fundamental es usarlo siempre con el cierre y las correas correctamente ajustados, comprobar que la talla
      abrace sin apretar, priorizar buena ventilación según tu clima y{" "}
      <strong>renovarlo tras un golpe importante</strong>, aunque no se note fisura, porque el material interior puede
      haber quedado comprometido.
    </p>
  </>
);

function useProductList(q: string, categoria: string, limit: number) {
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (categoria) p.set("category_slug", categoria);
    p.set("limit", String(limit));
    return p;
  }, [q, categoria, limit]);

  return useQuery({
    queryKey: ["products", q, categoria, limit],
    queryFn: () => apiFetch<ProductListResponse>(`/products?${qs.toString()}`, { auth: false }),
  });
}

export function ProductsPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const categoria = params.get("categoria") ?? "";

  const isCascoCategory = categoria === "cascos";
  const isSearchMode = Boolean(q);
  const isFullCatalog = !categoria && !isSearchMode;

  const mainLimit = isFullCatalog ? 100 : 24;
  const { data, isLoading, error } = useProductList(q, categoria, mainLimit);

  const categoryLabel = categoria ? (CATEGORY_LABELS[categoria] ?? categoria) : "";

  const helmetItems = useMemo(() => (data?.items ?? []).filter((p) => p.category_slug === "cascos"), [data?.items]);

  const gridItems = useMemo(() => {
    if (!data?.items) return [];
    if (isCascoCategory) return data.items;
    if (isFullCatalog) return data.items.filter((p) => p.category_slug !== "cascos");
    return data.items;
  }, [data?.items, isCascoCategory, isFullCatalog]);

  const showCascosSalesBlock = !isSearchMode && (isFullCatalog || isCascoCategory);
  const cascosPreview = isFullCatalog ? helmetItems.slice(0, 8) : [];

  return (
    <div className="container" style={{ paddingTop: "1.5rem" }}>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.65rem", marginBottom: "0.5rem" }}>
        {isCascoCategory ? "Cascos" : "Productos"}
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
        {q && `Búsqueda: “${q}” · `}
        {categoria && !isCascoCategory && `Categoría: ${categoryLabel} · Las imágenes se adaptan al tipo de bicicleta.`}
        {isCascoCategory && "Protección certificada para acompañar cada salida."}
        {!q && !categoria && "Todos los modelos disponibles. Las fotos reflejan la categoría de cada producto."}
      </p>

      {showCascosSalesBlock && (
        <section className={`shop-cascos-block ${isCascoCategory ? "shop-cascos-block--expanded" : ""}`} aria-labelledby="shop-cascos-heading">
          <h2 id="shop-cascos-heading" className="shop-cascos-title">
            Cascos · protección esencial
          </h2>
          {isCascoCategory ? (
            <div style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.55 }}>{CASCOS_INTRO_FULL}</div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>{CASCOS_INTRO_SHORT}</p>
          )}
          {isFullCatalog && cascosPreview.length > 0 && (
            <div className="shop-cascos-preview-grid" aria-label="Cascos destacados">
              {cascosPreview.map((p) => {
                const img = getProductImageUrl(p);
                return (
                  <Link key={p.id} to={`/productos/${p.slug}`} className="shop-cascos-card" style={{ color: "inherit" }}>
                    <FallbackImage
                      className="shop-cascos-card-img"
                      src={img}
                      alt={p.name}
                      fallbackSrc={productImageFallback(p.slug)}
                    />
                    <span className="shop-cascos-card-name">{p.name}</span>
                    <span className="shop-cascos-card-price">${p.price}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {isFullCatalog && (
            <div style={{ marginTop: "1rem" }}>
              <Link className="btn" to="/productos?categoria=cascos">
                Ver todos los cascos
              </Link>
            </div>
          )}
        </section>
      )}

      {isLoading && <p>Cargando…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{(error as Error).message}</p>}
      <div className="grid-products">
        {gridItems.map((p) => {
          const img = getProductImageUrl(p);
          return (
            <Link key={p.id} to={`/productos/${p.slug}`} className="card" style={{ color: "inherit" }}>
              <FallbackImage
                className="product-card-thumb"
                src={img}
                alt={p.name}
                fallbackSrc={productImageFallback(p.slug)}
              />
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="badge" style={{ marginTop: "0.35rem" }}>
                {p.category_slug}
              </div>
              <div style={{ marginTop: "0.5rem", color: "var(--accent-dim)", fontWeight: 700 }}>${p.price}</div>
            </Link>
          );
        })}
      </div>
      {data && gridItems.length === 0 && !isLoading && <p>No hay resultados.</p>}
      {isFullCatalog && !isLoading && helmetItems.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.75rem" }}>
          Ejecutá <code style={{ fontSize: "0.85em" }}>python -m scripts.seed</code> en el backend para cargar la categoría
          Cascos desde <code style={{ fontSize: "0.85em" }}>public/images/catalog/cascos</code>.
        </p>
      )}
    </div>
  );
}
