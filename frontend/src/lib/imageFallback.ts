/** Miniatura de respaldo determinista (picsum tolera hotlinking en desarrollo). */
export function picsumSeed(seed: string, w: number, h: number): string {
  const s = encodeURIComponent(seed.replace(/\s+/g, "-").slice(0, 64));
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}

export function productImageFallback(slug: string): string {
  return picsumSeed(`ebike-product-${slug}`, 800, 600);
}
