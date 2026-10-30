import { test, expect } from '@playwright/test';
import { authHeader, newUserToken } from '../../helpers/auth';
import { getProductWithStock, addCartItem, type CartItem } from '../../helpers/cart';

test.describe('Cart Items API', () => {

    test('POST /cart/items adds a product and GET /cart returns the added product', async ({ request }) => {
        // Add a new user and pick a product with stock
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, 1);

        // Add the product to the cart
        const createResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: { product_id: productToAdd.id, quantity: 1 }
        });
        expect(createResponse.status()).toBe(200);
        const itemAdded: CartItem = await createResponse.json();
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
        // Different quantities so "sums" (3) can't be confused with "replaces" (2) or "always adds 1" (2) (Arrange step)
        const firstQuantity = 1;
        const secondQuantity = 2;
        const totalQuantity = firstQuantity + secondQuantity;

        // Add a new user and pick a product with enough stock for both additions (Arrange step)
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, totalQuantity);

        // Add the product for the first time (Arrange step)
        const firstAddedItem = await addCartItem(request, token, productToAdd.id, firstQuantity);

        // Add the same product again: it has to be merged into the same cart item (Act step)
        const secondAddResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: { product_id: productToAdd.id, quantity: secondQuantity }
        });
        expect(secondAddResponse.status()).toBe(200);
        const mergedItem: CartItem = await secondAddResponse.json();
        expect(mergedItem.id).toBe(firstAddedItem.id);
        expect(mergedItem.product.id).toBe(productToAdd.id);
        expect(mergedItem.quantity).toBe(totalQuantity);
        const expectedLineTotal = (Number(productToAdd.price) * totalQuantity).toFixed(2);
        expect(mergedItem.line_total).toBe(expectedLineTotal);

        // Check the cart has a single item with the summed quantity (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([mergedItem]);
        expect(cart.subtotal).toBe(expectedLineTotal);
    });

    test('PATCH /cart/items/{id} replaces the quantity', async ({ request }) => {
        // Different quantities so "replaces" (3) can't be confused with "sums" (5) or "unchanged" (2) (Arrange step)
        const initialQuantity = 2;
        const newQuantity = 3;

        // Add a new user and pick a product with stock for the larger quantity (Arrange step)
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, Math.max(initialQuantity, newQuantity));

        // Add the product to the cart (Arrange step)
        const addedItem = await addCartItem(request, token, productToAdd.id, initialQuantity);

        // Replace the quantity (Act step)
        const replaceResponse = await request.patch(`/cart/items/${addedItem.id}`, {
            headers: authHeader(token),
            data: { quantity: newQuantity }
        });
        expect(replaceResponse.status()).toBe(200);
        const replacedItem: CartItem = await replaceResponse.json();
        expect(replacedItem.id).toBe(addedItem.id);
        expect(replacedItem.quantity).toBe(newQuantity);
        const expectedLineTotal = (Number(productToAdd.price) * newQuantity).toFixed(2);
        expect(replacedItem.line_total).toBe(expectedLineTotal);

        // Check the cart has a single item with the replaced quantity (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([replacedItem]);
        expect(cart.subtotal).toBe(expectedLineTotal);
    });
    test('DELETE /cart/items/{id} removes the whole line and GET /cart returns an empty cart', async ({ request }) => {
        // Quantity 2 so we check that DELETE removes the whole line, not just one unit (Arrange step)
        const quantity = 2;
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, quantity);
        // Add the product to the cart (Arrange step)
        const addedItem = await addCartItem(request, token, productToAdd.id, quantity);
        // Remove the item from the cart (Act step)
        const removeResponse = await request.delete(`/cart/items/${addedItem.id}`, {
            headers: authHeader(token)
        });
        expect(removeResponse.status()).toBe(204);
        expect(await removeResponse.text()).toBe('');
        // Check the cart is empty (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([]);
        expect(cart.subtotal).toBe('0');
    });
    test('DELETE /cart/items/{id} of another user\'s item returns 404 and keeps the item', async ({ request }) => {
        // Add the cart owner and another user, and pick a product with stock (Arrange step)
        const token = await newUserToken(request);
        const anotherToken = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, 1);
        // Add the product to the cart (Arrange step)
        const addedItem = await addCartItem(request, token, productToAdd.id, 1);
        // Another user tries to remove the item (Act step)
        const removeResponse = await request.delete(`/cart/items/${addedItem.id}`, {
            headers: authHeader(anotherToken)
        });
        expect(removeResponse.status()).toBe(404); // item not found to delete
        expect(await removeResponse.json()).toEqual({ detail: 'Cart item not found' });
        // Check the cart is not empty (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([addedItem]);
        expect(cart.subtotal).toBe(addedItem.line_total);
    });
    test('POST /cart/items with quantity above stock returns 400 and keeps the cart empty', async ({ request }) => {
        // Add a new user and pick a product with stock (Arrange step)
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, 2);
        // Try to add more units than the product has in stock (Act step)
        const addItemResponse = await request.post('/cart/items', {
            headers: authHeader(token),
            data: { product_id: productToAdd.id, quantity: productToAdd.stock + 1 }
        });
        // Check the stock is not enough to add the quantity requested (Assert step)
        expect(addItemResponse.status()).toBe(400); 
        expect(await addItemResponse.json()).toEqual({ "detail": "Not enough stock" });
        // Check the cart is empty (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([]);
        expect(cart.subtotal).toBe('0');
    });
    test('PATCH /cart/items/{id} with quantity above stock returns 400 and keeps the quantity', async ({ request }) => {
        // Add a new user and pick a product with stock (Arrange step)
        const token = await newUserToken(request);
        const productToAdd = await getProductWithStock(request, 2);
        // Add the product to the cart (Arrange step)
        const addedItem = await addCartItem(request, token, productToAdd.id, 1);
        // Replace the quantity (Act step)
        const replaceResponse = await request.patch(`/cart/items/${addedItem.id}`, {
            headers: authHeader(token),
            data: { quantity: productToAdd.stock + 1 }
        });
        // Check the stock is not enough to replace the quantity requested (Assert step)
        expect(replaceResponse.status()).toBe(400); 
        expect(await replaceResponse.json()).toEqual({ "detail": "Not enough stock" });
        // Check the quantity was not changed (Assert step)
        const listCartResponse = await request.get('/cart', {
            headers: authHeader(token)
        });
        expect(listCartResponse.status()).toBe(200);
        const cart = await listCartResponse.json();
        expect(cart.items).toEqual([addedItem]);
        expect(cart.subtotal).toBe(addedItem.line_total);
    });
});