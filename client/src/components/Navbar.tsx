import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { ShoppingCart, Store, Shield, LogOut } from 'lucide-react';
import Button from './ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-2xl font-black text-gray-900 tracking-tight">
              Bada<span className="text-amber-600">Vyapar</span>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                to="/products"
                className="text-gray-600 hover:text-amber-600 font-medium text-sm transition"
              >
                Browse Catalog
              </Link>
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className="text-gray-600 hover:text-amber-600 font-medium text-sm transition"
                >
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-4">
            {/* Cart Link */}
            <Link
              to="/cart"
              className="p-2 text-gray-600 hover:text-amber-600 rounded-full hover:bg-gray-100 transition relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Role Specific Actions */}
                {hasRole('ADMIN') && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center px-3 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md hover:bg-purple-100 transition"
                  >
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    Admin
                  </Link>
                )}

                {hasRole('VENDOR') ? (
                  <Link
                    to="/vendor"
                    className="hidden sm:inline-flex items-center px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md hover:bg-amber-100 transition"
                  >
                    <Store className="w-3.5 h-3.5 mr-1" />
                    Seller Portal
                  </Link>
                ) : (
                  <Link
                    to="/vendor/apply"
                    className="hidden sm:inline-block text-xs font-medium text-amber-600 hover:text-amber-700 underline"
                  >
                    Sell on BadaVyapar
                  </Link>
                )}

                {/* User Dropdown / Name */}
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
