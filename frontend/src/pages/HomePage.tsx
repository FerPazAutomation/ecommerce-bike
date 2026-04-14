import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getToken } from "../api/client";
import { CartIcon } from "../components/CartIcon";
import { FallbackImage } from "../components/FallbackImage";
import { LandingTestimonialCarousel } from "../components/LandingTestimonialCarousel";
import {
  DEFAULT_CATEGORY_SLUG,
  getVisualPackForCategory,
  LANDING_VIDEO_THUMB,
} from "../data/categoryVisuals";
import { selectHomeFeaturedSix } from "../lib/homeFeaturedCatalog";
import { productImageFallback } from "../lib/imageFallback";
import { getProductImageUrl } from "../lib/productImage";
import type { Category, Product, ProductListResponse } from "../types";

const FALLBACK_CATEGORIES: Category[] = [
  { id: 0, slug: "montana", name: "Montaña", description: "Bicicletas todo terreno." },
  { id: 0, slug: "ciudad", name: "Ciudad", description: "Urbanas y commuting." },
  { id: 0, slug: "electrica", name: "Eléctricas", description: "E-bikes y asistencia al pedaleo." },
];

const SWATCH_STYLE: { color: string; filter: string }[] = [
  { color: "#e74c3c", filter: "hue-rotate(-18deg) saturate(1.15)" },
  { color: "#5d6d7e", filter: "saturate(0.45) brightness(0.92)" },
  { color: "#2ecc71", filter: "none" },
  { color: "#3498db", filter: "hue-rotate(160deg) saturate(1.1)" },
];

const VIDEO_HREF =
  "https://www.youtube.com/results?search_query=bicicleta+el%C3%A9ctrica+monta%C3%B1a";

const BIKE_CATEGORY_SLUGS = new Set(["montana", "ciudad", "electrica"]);

export function HomePage() {
  const [selectedSlug, setSelectedSlug] = useState(DEFAULT_CATEGORY_SLUG);
  const [colorIdx, setColorIdx] = useState(2);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [loginGateOpen, setLoginGateOpen] = useState(false);

  const isLoggedIn = Boolean(getToken());
  const catalogHref = `/productos?categoria=${encodeURIComponent(selectedSlug)}`;

  useEffect(() => {
    if (!loginGateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLoginGateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loginGateOpen]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories", { auth: false }),
    retry: false,
  });

  const { data: featured } = useQuery({
    queryKey: ["featured-catalog"],
    queryFn: () => apiFetch<ProductListResponse>("/products?limit=60", { auth: false }),
    retry: false,
  });

  const navCategories = categories?.length ? categories : FALLBACK_CATEGORIES;
  const landingCategoryTabs = useMemo(
    () => navCategories.filter((c) => BIKE_CATEGORY_SLUGS.has(c.slug)),
    [navCategories],
  );

  const pack = useMemo(() => getVisualPackForCategory(selectedSlug), [selectedSlug]);
  const activeSlide = pack.slides[carouselIdx] ?? pack.slides[0];
  const mainSrc = activeSlide.src;

  const featuredItems = useMemo(
    () => (featured?.items?.length ? selectHomeFeaturedSix(featured.items) : []),
    [featured],
  );

  return (
    <div className="landing">
      <div className="container">
        <section className="landing-hero-grid">
          <div className="landing-hero-intro">
            <div className="landing-hero-intro__body">
              <p className="landing-kicker">E-bikes premium · Envíos y taller</p>
              <h1 className="landing-title">
                Eleva tu <span className="accent">trayecto</span> con <span className="accent">e-bikes</span> de primera
                calidad.
              </h1>
              <p className="landing-lead">
                Catálogo curado, asesoramiento real y taller propio. Elegí categoría en el panel de al lado, compará
                modelos y llevate la bici lista para rodar con revisión previa y garantía respaldada.
              </p>

              <div className="landing-stats">
                <div className="landing-stat">
                  <strong>8M+</strong>
                  <span>Servicio satisfactorio</span>
                </div>
                <div className="landing-stat">
                  <strong>02</strong>
                  <span>Años de garantía</span>
                </div>
                <div className="landing-stat">
                  <strong>30</strong>
                  <span>Días de devolución</span>
                </div>
              </div>
            </div>

            <div className="landing-hero-intro__tail">
              <div className="landing-cta-row">
                {isLoggedIn ? (
                  <Link className="landing-cta-btn" to={catalogHref}>
                    <span className="landing-cta-btn__label">Pide ahora</span>
                    <span className="landing-cta-btn__cart" aria-hidden>
                      <CartIcon size={22} />
                    </span>
                  </Link>
                ) : (
                  <button type="button" className="landing-cta-btn" onClick={() => setLoginGateOpen(true)}>
                    <span className="landing-cta-btn__label">Pide ahora</span>
                    <span className="landing-cta-btn__cart" aria-hidden>
                      <CartIcon size={22} />
                    </span>
                  </button>
                )}
                <div className="landing-seal" aria-hidden>
                  <span className="landing-seal__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="landing-seal__label">100% eficiencia eléctrica</span>
                </div>
              </div>

              <ul className="landing-hero-badges" aria-label="Servicios de la tienda">
                <li>Envío con seguimiento</li>
                <li>Financiación</li>
                <li>Taller y postventa</li>
              </ul>

              <LandingTestimonialCarousel categorySlug={selectedSlug} />
            </div>
          </div>

          <div className="landing-showcase">
            <p className="landing-kicker" style={{ marginBottom: "0.65rem" }}>
              Explora por categoría
            </p>
            <div className="landing-cat-tabs" role="tablist" aria-label="Categorías de bicicletas">
              {landingCategoryTabs.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  aria-selected={selectedSlug === c.slug}
                  className={`landing-cat-tab ${selectedSlug === c.slug ? "active" : ""}`}
                  onClick={() => {
                    setSelectedSlug(c.slug);
                    setCarouselIdx(0);
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="landing-bike-stack">
              <div className="landing-bike-frame-row">
                <div className="landing-bike-frame-col">
                  <div className="landing-bike-frame">
                    <img
                      src={mainSrc}
                      alt={`Bicicleta destacada · ${selectedSlug}`}
                      style={{ filter: SWATCH_STYLE[colorIdx]?.filter ?? "none" }}
                    />
                  </div>
                </div>
                <div className="hotspot-labels">
                  {activeSlide.hotspots.map((label, hi) => (
                    <div key={`${carouselIdx}-${hi}`} className="hotspot-item">
                      <span className="hotspot-dot" />
                      <span className="hotspot-line" aria-hidden />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="landing-swatches" aria-label="Acabados de color (vista previa)">
                {SWATCH_STYLE.map((s, i) => (
                  <button
                    key={s.color}
                    type="button"
                    className={`landing-swatch ${i === colorIdx ? "selected" : ""}`}
                    style={{ background: s.color }}
                    aria-label={`Color ${i + 1}`}
                    onClick={() => setColorIdx(i)}
                  />
                ))}
              </div>
              <div className="landing-carousel" aria-label="Otros modelos de la categoría">
                {pack.slides.map((slide, i) => (
                  <button
                    key={slide.src}
                    type="button"
                    className={carouselIdx === i ? "active" : ""}
                    onClick={() => setCarouselIdx(i)}
                    aria-label={i === 0 ? "Vista principal" : `Miniatura ${i + 1}`}
                  >
                    <img src={slide.src} alt="" />
                  </button>
                ))}
              </div>
              <div className="landing-dots" aria-hidden>
                {pack.slides.map((_, i) => (
                  <span key={i} className={carouselIdx === i ? "on" : ""} />
                ))}
              </div>
            </div>

            <div className="landing-subgrid">
              <div className="landing-helmets">
                <h3>Cascos</h3>
                <p>
                  Protección ligera y ventilada, pensada para quienes pedalean en{" "}
                  {selectedSlug === "montana" ? "sendero" : selectedSlug === "ciudad" ? "ciudad" : "rutas eléctricas"}.
                </p>
                <div className="landing-helmet-grid">
                  {pack.helmets.map((src) => (
                    <img key={src} src={src} alt="Casco de ciclismo" loading="lazy" />
                  ))}
                </div>
              </div>
              <a className="landing-video" href={VIDEO_HREF} target="_blank" rel="noopener noreferrer">
                <img src={LANDING_VIDEO_THUMB} alt="" />
                <span className="landing-video-play" aria-hidden>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="landing-video-caption">Mira este video</span>
              </a>
            </div>
          </div>
        </section>

        {loginGateOpen ? (
          <div className="landing-gate-overlay" role="presentation" onClick={() => setLoginGateOpen(false)}>
            <div
              className="landing-gate-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="landing-gate-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="landing-gate-title" className="landing-gate-dialog__title">
                Necesitás una cuenta
              </h2>
              <p className="landing-gate-dialog__text">
                Para agregar productos al carrito y completar tu pedido, primero iniciá sesión o registrate. Después
                podés volver al catálogo y elegir tu e-bike con tranquilidad.
              </p>
              <div className="landing-gate-dialog__actions">
                <Link to="/login" className="btn" onClick={() => setLoginGateOpen(false)}>
                  Iniciar sesión
                </Link>
                <Link to="/login?registro=1" className="btn btn-ghost" onClick={() => setLoginGateOpen(false)}>
                  Registrarse
                </Link>
              </div>
              <button type="button" className="landing-gate-dialog__close" onClick={() => setLoginGateOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>
          </div>
        ) : null}

        <section className="landing-featured" id="catalogo">
          <h2>Destacados del catálogo</h2>
          {featuredItems.length ? (
            <div className="grid-products landing-featured-grid">
              {featuredItems.map((p) => (
                <FeaturedCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>
              Cuando la API y PostgreSQL estén activos, aquí verás productos reales. Mientras tanto, usa el escaparate
              superior y el{" "}
              <Link to="/productos">catálogo</Link>.
            </p>
          )}
        </section>

        <section className="landing-contact" id="contacto">
          <h2>Hablemos</h2>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>
            ¿Dudas sobre tallas, autonomía o envíos? Escríbenos desde{" "}
            <Link to="/sobre-nosotros">Contacto</Link> o visita la tienda física en Tucson.
          </p>
        </section>
      </div>
    </div>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const src = getProductImageUrl(product);
  return (
    <Link to={`/productos/${product.slug}`} className="card" style={{ display: "block", color: "inherit" }}>
      <FallbackImage
        className="product-card-thumb"
        src={src}
        alt={product.name}
        fallbackSrc={productImageFallback(product.slug)}
      />
      <div style={{ fontWeight: 700 }}>{product.name}</div>
      <div className="badge" style={{ marginTop: "0.35rem" }}>
        {product.category_slug}
      </div>
      <div style={{ marginTop: "0.5rem", color: "var(--accent-dim)", fontWeight: 700 }}>${product.price}</div>
    </Link>
  );
}
