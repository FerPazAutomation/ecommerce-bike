import { test, expect } from '@playwright/test';
import { authHeader, newUserToken } from '../../helpers/auth';
import { getProductWithStock, type CartItem } from '../../helpers/cart';

test.describe('Cart Items API', () => {

    test('POST /cart/items adds a product and GET /cart returns the added product', async ({ request }) => {
        // Add a new user and pick a product with stock
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, 1);

        // Add the product to the cart
        const createResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: {product_id: productToAdd.id, quantity: 1}
        });
        expect(createResponse.status()).toBe(200);
        const itemAdded : CartItem = await createResponse.json();
        expect(itemAdded.product.id).toBe(productToAdd.id);
        expect(itemAdded.quantity).toBe(1);
        expect(itemAdded.line_total).toBe(productToAdd.price);

        // Check the cart items are updated with the new product
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([itemAdded]);
        expect(cart.subtotal).toBe(itemAdded.line_total);
    });

    test('POST /cart/items with the same product twice sums the quantity', async ({ request }) => {
        // Different quantities so "sums" (3) can't be confused with "replaces" (2) or "always adds 1" (2)
        const firstQuantity = 1;
        const secondQuantity = 2;
        const totalQuantity = firstQuantity + secondQuantity;

        // Add a new user and pick a product with enough stock for both additions
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, totalQuantity);

        // Add the product for the first time
        const firstAddResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: {product_id: productToAdd.id, quantity: firstQuantity}
        });
        expect(firstAddResponse.status()).toBe(200);
        const firstItem : CartItem = await firstAddResponse.json();

        // Add the same product again: it has to be merged into the same cart item
        const secondAddResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: {product_id: productToAdd.id, quantity: secondQuantity}
        });
        expect(secondAddResponse.status()).toBe(200);
        const mergedItem : CartItem = await secondAddResponse.json();
        expect(mergedItem.id).toBe(firstItem.id);
        expect(mergedItem.product.id).toBe(productToAdd.id);
        expect(mergedItem.quantity).toBe(totalQuantity);
        const expectedLineTotal = (Number(productToAdd.price) * totalQuantity).toFixed(2);
        expect(mergedItem.line_total).toBe(expectedLineTotal);

        // Check the cart has a single item with the summed quantity
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([mergedItem]);
        expect(cart.subtotal).toBe(expectedLineTotal);
    });
});
