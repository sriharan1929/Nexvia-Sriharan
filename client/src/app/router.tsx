import { Routes, Route, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VendorApplyPage from '../pages/VendorApplyPage';
import VendorDashboardPage from '../pages/VendorDashboardPage';
import AdminVendorsPage from '../pages/AdminVendorsPage';
import CatalogPage from '../pages/CatalogPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import useAuth from '../hooks/useAuth';
import Button from '../components/ui/Button';

function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-6">
            Multi-Vendor E-Commerce Platform
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight mb-6">
            Everything you love, from <br className="hidden sm:inline" />
            <span className="text-amber-600">independent sellers</span> across India.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10">
            One single checkout. Products from multiple approved vendors. Complete transparency, instant order tracking, and seamless fulfillment.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/products">
              <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-md">
                Explore Marketplace
              </Button>
            </Link>
            {!isAuthenticated ? (
              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Start Selling
                </Button>
              </Link>
            ) : (
              <div className="text-sm text-gray-500">
                Logged in as <strong className="text-gray-800">{user?.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="font-bold text-gray-900 mb-1">Unified Multi-Vendor Checkout</h3>
              <p className="text-gray-600 text-sm">
                Add items from multiple vendors and check out in one single payment. Each vendor fulfills their own items independently.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-1">Live Elastic Search & Cart</h3>
              <p className="text-gray-600 text-sm">
                Instant full-text product search with faceted filters, backed by Redis-powered persistent customer carts.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-gray-900 mb-1">Automated Split Transfers</h3>
              <p className="text-gray-600 text-sm">
                Automated platform commission deductions and instant vendor payouts via Razorpay Route linked accounts.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} BadaVyapar (badavyapar.com). All rights reserved.
      </footer>
    </div>
  );
}

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
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<CatalogPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />

      {/* Vendor Onboarding & Portal */}
      <Route
        path="/vendor/apply"
        element={
          <ProtectedRoute>
            <VendorApplyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/*"
        element={
          <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
            <VendorDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Moderation Console */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminVendorsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
