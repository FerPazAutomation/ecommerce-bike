import type { Product } from "../types";
import { getProductImageUrl } from "./productImage";

type Cat = "montana" | "electrica" | "ciudad";

/** Orden en el grid: fila1 Montaña · E-bike · Ciudad, fila2 igual con el segundo modelo de cada línea. */
const SLOT_SEQUENCE: Cat[] = [
  "montana",
  "electrica",
  "ciudad",
  "montana",
  "electrica",
  "ciudad",
];

/**
 * Elige 6 productos con imágenes distintas, intercalando categorías.
 * Si una URL ya se usó, toma el siguiente modelo de esa categoría.
 */
export function selectHomeFeaturedSix(products: Product[]): Product[] {
  const buckets: Record<Cat, Product[]> = {
    montana: [],
    electrica: [],
    ciudad: [],
  };
  for (const p of products) {
    const k = p.category_slug as Cat;
    if (buckets[k]) buckets[k].push(p);
  }
  for (const k of Object.keys(buckets) as Cat[]) {
    buckets[k].sort((a, b) => a.slug.localeCompare(b.slug));
  }
  const ptr: Record<Cat, number> = { montana: 0, electrica: 0, ciudad: 0 };
  const seenUrl = new Set<string>();
  const out: Product[] = [];

  for (const cat of SLOT_SEQUENCE) {
    const list = buckets[cat];
    while (ptr[cat] < list.length) {
      const p = list[ptr[cat]++];
      const url = getProductImageUrl(p);
      if (seenUrl.has(url)) continue;
      seenUrl.add(url);
      out.push(p);
      break;
    }
  }
  return out;
}
