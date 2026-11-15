import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { MEGA_MENU_DATA } from '../data/megaMenuData';
import {
  Search,
  User as UserIcon,
  Heart,
  ShoppingBag,
  X,
  Store,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  // Navigation hover state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Search state & suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const POPULAR_SEARCHES = [
    { title: 'T-Shirts for Men', query: 'tshirt' },
    { title: 'Kashmiri Pashmina Shawls', query: 'pashmina' },
    { title: 'Gaming Keyboards & Peripherals', query: 'keyboard' },
    { title: 'Pure Cotton Bedsheets', query: 'bedspread' },
    { title: 'Ceramic Dinner Sets', query: 'ceramic' },
    { title: 'Wireless Gaming Mouse', query: 'mouse' },
  ];

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSuggestion = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const activeCategory = MEGA_MENU_DATA.find((m) => m.id === activeMenuId);

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_4px_12px_0_rgba(0,0,0,0.05)] border-b border-[#E9E9ED]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* 1. Left: Brand Logo & Department Menus */}
          <div className="flex items-center space-x-8 h-full">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-tr from-[#FF3F6C] via-[#FF527B] to-[#FF905A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xl tracking-tighter">BV</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-[#282C3F]">
                  Bada<span className="text-[#FF3F6C]">Vyapar</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#535766] uppercase -mt-1">
                  Fashion & Market
                </span>
              </div>
            </Link>

            {/* Department Navigation Links */}
            <nav className="hidden lg:flex items-center h-full space-x-2">
              {MEGA_MENU_DATA.map((cat) => (
                <div
                  key={cat.id}
                  className="h-full flex items-center relative"
                  onMouseEnter={() => setActiveMenuId(cat.id)}
                >
                  <Link
                    to={`/products?category=${cat.id}`}
                    className={`h-full flex items-center px-4 text-xs font-bold tracking-wider uppercase transition-colors border-b-4 ${
                      activeMenuId === cat.id
                        ? 'border-[#FF3F6C] text-[#282C3F]'
                        : 'border-transparent text-[#282C3F] hover:border-[#FF3F6C]'
                    }`}
                  >
                    {cat.label}
                  </Link>
                </div>
              ))}

              {/* Studio with "NEW" badge */}
              <div className="h-full flex items-center">
                <Link
                  to="/products?tag=trending"
                  className="h-full flex items-center px-4 text-xs font-bold tracking-wider uppercase text-[#282C3F] hover:border-b-4 hover:border-[#FF3F6C] relative border-b-4 border-transparent"
                >
                  STUDIO
                  <span className="absolute top-4 right-1 text-[9px] font-bold text-[#FF3F6C] uppercase">
                    NEW
                  </span>
                </Link>
              </div>
            </nav>
          </div>

          {/* 2. Center: Search Bar with Autocomplete Suggestions */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[#535766] pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for products, brands and more"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F5F5F6] border border-transparent rounded-sm text-xs text-[#282C3F] placeholder-[#94969F] focus:bg-white focus:border-[#E9E9ED] focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Suggestions Overlay */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E9ED] rounded-sm shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-[#F5F5F6] bg-[#F5F5F6]/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#535766] uppercase tracking-wider">
                    Popular Searches
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#FF3F6C]" />
                </div>
                <div className="py-1">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onClick={() => handleSelectSuggestion(item.query)}
                      className="w-full text-left px-4 py-2 text-xs text-[#282C3F] hover:bg-[#F5F5F6] flex items-center justify-between group transition"
                    >
                      <span>{item.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF3F6C] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Right: Profile, Wishlist & Bag Action Icons (Myntra Stacked Layout) */}
          <div className="flex items-center space-x-6">
            {/* Profile Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="flex flex-col items-center cursor-pointer group py-2">
                <UserIcon className="w-5 h-5 text-[#282C3F] group-hover:text-[#FF3F6C] transition-colors" />
                <span className="text-[10px] font-bold tracking-tight text-[#282C3F] uppercase mt-1 group-hover:text-[#FF3F6C] transition-colors">
                  Profile
                </span>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full w-72 bg-white border border-[#E9E9ED] shadow-xl rounded-sm z-50 overflow-hidden py-4 animate-in fade-in">
                  {isAuthenticated && user ? (
                    <div>
                      <div className="px-5 pb-3 border-b border-[#E9E9ED]">
                        <p className="font-bold text-sm text-[#282C3F]">{user.name}</p>
                        <p className="text-xs text-[#535766] truncate">{user.email}</p>
                      </div>

                      <div className="py-2 text-xs text-[#282C3F]">
                        <Link
                          to="/orders"
                          className="block px-5 py-2 hover:bg-[#F5F5F6] hover:font-bold transition"
                        >
                          Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-5 py-2 hover:bg-[#F5F5F6] hover:font-bold transition"
                        >
                          Wishlist
                        </Link>
                        <Link
                          to="/cart"
                          className="block px-5 py-2 hover:bg-[#F5F5F6] hover:font-bold transition"
                        >
                          Shopping Bag
                        </Link>

                        {/* Vendor Portal Shortcut */}
                        {hasRole('VENDOR') ? (
                          <Link
                            to="/vendor"
                            className="block px-5 py-2 text-[#FF3F6C] font-bold hover:bg-[#F5F5F6] transition"
                          >
                            <Store className="w-3.5 h-3.5 inline mr-1.5" /> Seller Dashboard
                          </Link>
                        ) : (
                          <Link
                            to="/vendor/apply"
                            className="block px-5 py-2 text-amber-700 hover:bg-[#F5F5F6] transition"
                          >
                            Sell on BadaVyapar
                          </Link>
                        )}

                        {/* Admin Moderation Shortcut */}
                        {hasRole('ADMIN') && (
                          <Link
                            to="/admin/analytics"
                            className="block px-5 py-2 text-purple-700 font-bold hover:bg-[#F5F5F6] transition"
                          >
                            <Shield className="w-3.5 h-3.5 inline mr-1.5" /> Admin Control Center
                          </Link>
                        )}
                      </div>

                      <div className="px-5 pt-2 border-t border-[#E9E9ED]">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left py-1 text-xs font-bold text-red-600 hover:text-red-700 flex items-center"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="px-5 pb-3 border-b border-[#E9E9ED]">
                        <p className="font-bold text-sm text-[#282C3F]">Welcome</p>
                        <p className="text-xs text-[#535766] mt-0.5">
                          To access account and manage orders
                        </p>
                        <Link to="/login" className="mt-3 block">
                          <button className="w-full py-2 bg-[#FF3F6C] text-white text-xs font-bold tracking-wider uppercase rounded-sm hover:bg-[#e0325d] transition">
                            LOGIN / SIGNUP
                          </button>
                        </Link>
                      </div>

                      <div className="py-2 text-xs text-[#282C3F]">
                        <Link
                          to="/login"
                          className="block px-5 py-2 hover:bg-[#F5F5F6] hover:font-bold transition"
                        >
                          Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-5 py-2 hover:bg-[#F5F5F6] hover:font-bold transition"
                        >
                          Wishlist
                        </Link>
                        <Link
                          to="/vendor/apply"
                          className="block px-5 py-2 text-amber-700 font-semibold hover:bg-[#F5F5F6] transition"
                        >
                          Sell on BadaVyapar
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link to="/wishlist" className="flex flex-col items-center group py-2 relative">
              <div className="relative">
                <Heart className="w-5 h-5 text-[#282C3F] group-hover:text-[#FF3F6C] transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF3F6C] text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight text-[#282C3F] uppercase mt-1 group-hover:text-[#FF3F6C] transition-colors">
                Wishlist
              </span>
            </Link>

            {/* Shopping Bag Icon */}
            <Link to="/cart" className="flex flex-col items-center group py-2 relative">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#282C3F] group-hover:text-[#FF3F6C] transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF3F6C] text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight text-[#282C3F] uppercase mt-1 group-hover:text-[#FF3F6C] transition-colors">
                Bag
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Full-Width Mega Menu Dropdown on Category Hover */}
      {activeCategory && (
        <div
          className="absolute top-full left-0 right-0 bg-white border-b border-[#E9E9ED] shadow-2xl z-40 transition-all animate-in fade-in"
          onMouseEnter={() => setActiveMenuId(activeCategory.id)}
          onMouseLeave={() => setActiveMenuId(null)}
        >
          <div className="max-w-[1440px] mx-auto px-8 py-8">
            <div className="grid grid-cols-4 gap-8">
              {activeCategory.columns.map((col) => (
                <div key={col.title} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF3F6C] border-b border-[#F5F5F6] pb-2">
                    {col.title}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#282C3F]">
                    {col.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          to={`/products?q=${encodeURIComponent(item.query)}`}
                          onClick={() => setActiveMenuId(null)}
                          className="hover:font-bold hover:text-[#282C3F] text-[#535766] transition block py-0.5"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
