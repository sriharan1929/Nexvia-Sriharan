import { Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VendorApplyPage from '../pages/VendorApplyPage';
import VendorDashboardPage from '../pages/VendorDashboardPage';
import AdminVendorsPage from '../pages/AdminVendorsPage';
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage';
import CatalogPage from '../pages/CatalogPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import WishlistPage from '../pages/WishlistPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrdersPage from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import VendorOrdersPage from '../pages/VendorOrdersPage';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Page not found</p>
        <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">
          Return home
        </Link>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>

      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<CatalogPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendor/apply"
        element={
          <ProtectedRoute>
            <VendorApplyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
            <VendorOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
            <VendorDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminVendorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminAnalyticsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
