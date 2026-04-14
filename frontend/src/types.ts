export type Category = { id: number; slug: string; name: string; description: string | null };

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock: number;
  category_slug: string;
};

export type ProductListResponse = { items: Product[]; total: number };

export type ProductSuggestionsResponse = { items: { name: string; slug: string }[] };

export type CartItem = {
  id: number;
  quantity: number;
  product: Product;
  line_total: string;
};

export type CartResponse = { items: CartItem[]; subtotal: string };

export type CheckoutResponse = { checkout_url: string; order_id: number };

export type UserProfile = { id: number; email: string; full_name: string };

export type OrderSummary = {
  id: number;
  status: string;
  total_amount: string;
  currency: string;
  created_at: string;
};

export type OrderItemLine = {
  product_id: number;
  quantity: number;
  unit_price: string;
  name: string;
};

export type OrderDetail = {
  id: number;
  status: string;
  total_amount: string;
  currency: string;
  created_at: string;
  items: OrderItemLine[];
};
