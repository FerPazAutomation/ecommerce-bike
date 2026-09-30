import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { AboutPage } from "./pages/AboutPage";
import { AccountPage } from "./pages/AccountPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutCancelPage } from "./pages/CheckoutCancelPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { HomePage } from "./pages/HomePage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ServicePage } from "./pages/ServicePage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/productos/:slug" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar" element={<ForgotPasswordPage />} />
        <Route
          path="/cuenta"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/carrito"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        <Route path="/sobre-nosotros" element={<AboutPage />} />
        <Route path="/servicio" element={<ServicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
