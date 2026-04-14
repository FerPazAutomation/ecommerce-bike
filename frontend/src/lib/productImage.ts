import { DEFAULT_PRODUCT_IMAGE, getVisualPackForCategory } from "../data/categoryVisuals";

export function getProductImageUrl(product: { image_url: string | null; category_slug: string }): string {
  if (product.image_url?.trim()) return product.image_url;
  return getVisualPackForCategory(product.category_slug).slides[0]?.src ?? DEFAULT_PRODUCT_IMAGE;
}
