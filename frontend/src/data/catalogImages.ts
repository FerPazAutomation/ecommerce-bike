/** Rutas públicas (`frontend/public/images/catalog/…`) alineadas con `backend/scripts/seed.py`. */
export function catalogImage(category: "ciudad" | "montana" | "electrica", index: number): string {
  return `/images/catalog/${category}/${category}-${String(index).padStart(2, "0")}.png`;
}
