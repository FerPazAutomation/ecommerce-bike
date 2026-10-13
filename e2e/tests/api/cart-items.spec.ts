import { test, expect } from '@playwright/test';
import { authHeader, newUserToken } from '../../helpers/auth';

type Product = { id: number; price: string; stock: number };
type CartItem = { id: number; quantity: number; product: Product; line_total: string };

test.describe('Cart Items API', () => {

    test('POST /cart/items adds a product and GET /cart returns the added product', async ({ request }) => {
      
        // Add a new user and get the products
        const token = await newUserToken(request);
        const getProductsResponse = await request.get('/products');
        expect(getProductsResponse.status()).toBe(200);
        const productToAdd : Product = (await getProductsResponse.json()).items[0];

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
        const cart = await listCartResponse.json()
        expect(cart.items).toEqual([itemAdded]);
        expect(cart.subtotal).toBe(itemAdded.line_total);
    });
});
