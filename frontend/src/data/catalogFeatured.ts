/** Un modelo por categoría: primera referencia de cada línea en seed; prioridad en “Destacados”. */
export const CATALOG_FEATURED_SLUGS = ["ciudad-linea-01", "mtb-trail-01", "ebike-volt-01"] as const;

export function isCatalogFeaturedSlug(slug: string): boolean {
  return (CATALOG_FEATURED_SLUGS as readonly string[]).includes(slug);
}
