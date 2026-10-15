import { type APIRequestContext, expect } from "@playwright/test";

export type Product = { id: number; price: string; stock: number };
export type CartItem = { id: number; quantity: number; product: Product; line_total: string };

/** Obtiene un producto con stock mayor o igual al stock indicado. */
export async function getProductWithStock(request: APIRequestContext, minStock: number): Promise<Product> {
  const response = await request.get("/products");
  expect(response.status(), "GET /products in getProductWithStock").toBe(200);
  const products : Product[] = (await response.json()).items;
  const product = products.find((candidate) => candidate.stock >= minStock);
  if (!product) {
      throw new Error(`No product with stock greater or equal to ${minStock} found`);}
  return product;
}
