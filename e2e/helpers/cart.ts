import { type APIRequestContext, expect } from "@playwright/test";
import { authHeader } from "./auth";

export type Product = { id: number; price: string; stock: number };
export type CartItem = { id: number; quantity: number; product: Product; line_total: string };

/** Get a product with stock greater or equal to the minimum stock. */
export async function getProductWithStock(request: APIRequestContext, minStock: number): Promise<Product> {
    const listProductsResponse = await request.get("/products");
    expect(listProductsResponse.status(), "GET /products in getProductWithStock").toBe(200);
    const products: Product[] = (await listProductsResponse.json()).items;
    const product = products.find((candidate) => candidate.stock >= minStock);
    if (!product) {
        throw new Error(`No product with stock greater or equal to ${minStock} found`);
    }
    return product;
}

/** Add a product to the cart. */
export async function addCartItem(request: APIRequestContext, token: string, productId: number, quantity: number): Promise<CartItem> {
    const addResponse = await request.post("/cart/items", {
        headers: authHeader(token),
        data: { product_id: productId, quantity }
    });
    expect(addResponse.status(), "POST /cart/items in addCartItem").toBe(200);
    const addedItem: CartItem = await addResponse.json();
    return addedItem;
}