import { Routes, Route } from 'react-router-dom';

// Placeholder pages — will be built in later phases
function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Bada<span className="text-amber-600">Vyapar</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          India's Multi-Vendor Marketplace
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/login"
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
          >
            Get Started
          </a>
          <a
            href="/products"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Browse Products
          </a>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Page not found</p>
        <a href="/" className="text-amber-600 hover:text-amber-700 font-medium">
          Go home
        </a>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />

      {/* Auth — Phase 1 */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
      {/* <Route path="/register" element={<RegisterPage />} /> */}

      {/* Catalog — Phase 2 */}
      {/* <Route path="/products" element={<ProductsPage />} /> */}
      {/* <Route path="/products/:slug" element={<ProductDetailPage />} /> */}

      {/* Cart & Checkout — Phase 4-5 */}
      {/* <Route path="/cart" element={<CartPage />} /> */}
      {/* <Route path="/checkout" element={<CheckoutPage />} /> */}

      {/* Customer Orders — Phase 5 */}
      {/* <Route path="/orders" element={<OrdersPage />} /> */}
      {/* <Route path="/orders/:id" element={<OrderDetailPage />} /> */}

      {/* Vendor Dashboard — Phase 2 */}
      {/* <Route path="/vendor/*" element={<VendorLayout />} /> */}

      {/* Admin Dashboard — Phase 2 */}
      {/* <Route path="/admin/*" element={<AdminLayout />} /> */}

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
