---
name: ebike-homepage
description: Criterios para mejorar la homepage/landing del e-commerce e-bike como una tienda real (hero, categorías, destacados, confianza, rendimiento, SEO y estados de carga). Usar cuando se trabaje en HomePage.tsx, Layout, navegación principal, banners, destacados o testimonios de e-bike.
---

# Homepage de e-bike

Seguir primero `ebike-feature-workflow`.

## Piezas actuales

| Pieza | Dónde |
|-------|-------|
| Página | `frontend/src/pages/HomePage.tsx` |
| Header / nav / footer | `frontend/src/components/Layout.tsx` |
| Categorías (API + fallback) | `GET /categories`, `FALLBACK_CATEGORIES` en `HomePage.tsx` |
| Destacados | `frontend/src/lib/homeFeaturedCatalog.ts` (`selectHomeFeaturedSix`) |
| Visuales por categoría | `frontend/src/data/categoryVisuals.ts` |
| Testimonios | `frontend/src/components/LandingTestimonialCarousel.tsx`, `data/landingTestimonials.ts` |
| Imágenes | `FallbackImage`, `lib/productImage.ts`, `lib/imageFallback.ts` |

## Qué debe tener una home de e-commerce real

1. **Hero** con propuesta de valor en una frase y **un CTA principal** ("Ver bicicletas" → `/productos`).
2. **Categorías** navegables (Montaña, Ciudad, Eléctricas, Cascos) que lleven a `/productos?categoria=<slug>`.
3. **Destacados** con precio, imagen y link al detalle; datos reales de la API, no hardcodeados.
4. **Confianza**: envío, garantía, servicio técnico (`/servicio`), testimonios.
5. **Footer** con links de ayuda y contacto.

## Checklist de calidad

- [ ] Un solo `<h1>` y jerarquía de headings ordenada (h2 por sección).
- [ ] Estados de **carga, error y vacío** para categorías y destacados (hoy `retry: false` y fallback silencioso).
- [ ] Imágenes con `alt` descriptivo, `loading="lazy"` debajo del pliegue y tamaño explícito (evita saltos de layout).
- [ ] Carruseles y modales operables con teclado; modal con `role="dialog"`, `aria-modal` y cierre con Escape (el login gate ya cierra con Escape).
- [ ] Links externos con `rel="noopener noreferrer"`.
- [ ] `<title>` y meta description (en `frontend/index.html` o por página).
- [ ] Responsive: probar en 375 px, 768 px y 1280 px.
- [ ] Sin lógica de negocio en el componente: selección y armado de datos en `lib/` con test Vitest.

## Mantenibilidad

- `HomePage.tsx` es grande: al tocarlo, extraer secciones a componentes (`HomeHero`, `HomeCategories`, `HomeFeatured`) en `frontend/src/components/home/`.
- Textos y datos estáticos en `frontend/src/data/`, no dentro del JSX.
- Colores y espaciados con variables CSS de `index.css`, no estilos inline nuevos.

## Testeabilidad

- Secciones con heading accesible para que los specs las encuentren (`getByRole("heading", { name: ... })`).
- Si se agrega una sección nueva, sugerir a Fernando el caso de test UI correspondiente (no escribirlo sin pedido).
