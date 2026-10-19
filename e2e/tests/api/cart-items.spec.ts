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
        //Different quantities so "replaces" (3) can't be confused with "sums" (5) or "unchanged" (2) (Arrange step)
        const initialQuantity = 2;
        const newQuantity = 3;

        //  Add a new user and pick a product with stock for the larger quantity (Arrange step)
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
});
