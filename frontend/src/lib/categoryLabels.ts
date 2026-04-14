/** Etiquetas para UI; los slugs de API siguen siendo ASCII (`montana`, etc.). */
const SLUG_LABELS: Record<string, string> = {
  montana: "Montaña",
  ciudad: "Ciudad",
  electrica: "Eléctricas",
};

export function categorySlugLabel(slug: string): string {
  return SLUG_LABELS[slug] ?? slug;
}
