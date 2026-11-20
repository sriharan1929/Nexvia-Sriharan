import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import type { Product, Category } from '../types';
import { ChevronRight, X, SlidersHorizontal, ArrowUpDown, Star, Search } from 'lucide-react';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'recommended';
  const priceRange = searchParams.get('price') || '';
  const minRating = searchParams.get('rating') || '';

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (q) queryParams.set('q', q);
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (sort && sort !== 'recommended') queryParams.set('sort', sort);

        const [prodRes, catRes] = await Promise.all([
          api.get(`/products?${queryParams.toString()}`),
          api.get('/categories'),
        ]);

        let items: Product[] = prodRes.data.data.products || prodRes.data.data || [];

        // Client-side price & rating refinement if filtered
        if (priceRange) {
          if (priceRange === 'under1500') {
            items = items.filter((p) => p.pricePaise < 150000);
          } else if (priceRange === '1500to3000') {
            items = items.filter((p) => p.pricePaise >= 150000 && p.pricePaise <= 300000);
          } else if (priceRange === 'above3000') {
            items = items.filter((p) => p.pricePaise > 300000);
          }
        }

        if (minRating) {
          const ratingVal = parseFloat(minRating);
          items = items.filter((p) => (p.ratingSummary?.average || 0) >= ratingVal);
        }

        // Sorting
        if (sort === 'price_asc') {
          items.sort((a, b) => a.pricePaise - b.pricePaise);
        } else if (sort === 'price_desc') {
          items.sort((a, b) => b.pricePaise - a.pricePaise);
        } else if (sort === 'rating') {
          items.sort((a, b) => (b.ratingSummary?.average || 0) - (a.ratingSummary?.average || 0));
        }

        setProducts(items);
        setCategories(catRes.data.data || []);
      } catch (error) {
        console.error('Failed to load catalog data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, [q, selectedCategory, sort, priceRange, minRating]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (q) newParams.set('q', q);
    setSearchParams(newParams);
  };

  const currentCategory = categories.find((c) => c.slug === selectedCategory);
  const pageTitle = q
    ? `Results for "${q}"`
    : currentCategory?.name || (selectedCategory ? selectedCategory.toUpperCase() : 'Lifestyle & Fashion');

  const hasActiveFilters = Boolean(selectedCategory || priceRange || minRating);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs text-[#535766] mb-4">
          <Link to="/" className="hover:text-[#282C3F] transition">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link to="/products" className="hover:text-[#282C3F] transition">
            Clothing
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-bold text-[#282C3F]">{pageTitle}</span>
        </nav>

        {/* Category Heading & Item Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E9E9ED] mb-6 gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#282C3F] tracking-tight">
              {pageTitle}{' '}
              <span className="font-normal text-sm text-[#535766]">
                - {products.length} {products.length === 1 ? 'item' : 'items'}
              </span>
            </h1>
          </div>

          {/* Right Toolbar: Sort Dropdown & Mobile Filter Trigger */}
          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 border border-[#E9E9ED] rounded-sm text-xs font-bold text-[#282C3F]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#535766] hidden sm:inline">Sort by:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="appearance-none bg-white border border-[#E9E9ED] rounded-sm py-1.5 pl-3 pr-8 text-xs font-bold text-[#282C3F] cursor-pointer hover:border-[#282C3F] focus:outline-none transition"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">What's New</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#535766] mr-2">
              Active Filters:
            </span>

            {selectedCategory && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F5F6] text-[#282C3F] border border-[#E9E9ED]">
                {currentCategory?.name || selectedCategory}
                <button
                  onClick={() => updateParam('category', '')}
                  className="ml-1.5 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {priceRange && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F5F6] text-[#282C3F] border border-[#E9E9ED]">
                {priceRange === 'under1500'
                  ? 'Under ₹1,500'
                  : priceRange === '1500to3000'
                  ? '₹1,500 - ₹3,000'
                  : 'Above ₹3,000'}
                <button
                  onClick={() => updateParam('price', '')}
                  className="ml-1.5 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F5F6] text-[#282C3F] border border-[#E9E9ED]">
                {minRating}
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 mx-1" />
                and above
                <button
                  onClick={() => updateParam('rating', '')}
                  className="ml-1.5 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-[#FF3F6C] hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* 2-Column PLP Layout: Sidebar + Product Grid */}
        <div className="flex gap-8">
          {/* Left Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E9E9ED] pr-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E9ED]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#282C3F]">
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-[#FF3F6C] hover:underline uppercase"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Categories Filter */}
            <div className="space-y-3 pb-6 border-b border-[#E9E9ED]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#282C3F]">
                Categories
              </h4>
              <div className="space-y-2 text-xs text-[#282C3F]">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => updateParam('category', '')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((c) => (
                  <label key={c._id} className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === c.slug}
                      onChange={() => updateParam('category', c.slug)}
                      className="accent-[#FF3F6C]"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3 pb-6 border-b border-[#E9E9ED]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#282C3F]">
                Price
              </h4>
              <div className="space-y-2 text-xs text-[#282C3F]">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={!priceRange}
                    onChange={() => updateParam('price', '')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>Any Price</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'under1500'}
                    onChange={() => updateParam('price', 'under1500')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>Under ₹1,500</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === '1500to3000'}
                    onChange={() => updateParam('price', '1500to3000')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>₹1,500 to ₹3,000</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange === 'above3000'}
                    onChange={() => updateParam('price', 'above3000')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>Above ₹3,000</span>
                </label>
              </div>
            </div>

            {/* Customer Rating Filter */}
            <div className="space-y-3 pb-6 border-b border-[#E9E9ED]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#282C3F]">
                Customer Rating
              </h4>
              <div className="space-y-2 text-xs text-[#282C3F]">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={!minRating}
                    onChange={() => updateParam('rating', '')}
                    className="accent-[#FF3F6C]"
                  />
                  <span>All Ratings</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === '4'}
                    onChange={() => updateParam('rating', '4')}
                    className="accent-[#FF3F6C]"
                  />
                  <span className="flex items-center">
                    4 <Star className="w-3 h-3 fill-amber-400 text-amber-400 mx-1" /> and above
                  </span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === '3'}
                    onChange={() => updateParam('rating', '3')}
                    className="accent-[#FF3F6C]"
                  />
                  <span className="flex items-center">
                    3 <Star className="w-3 h-3 fill-amber-400 text-amber-400 mx-1" /> and above
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Right Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF3F6C] mx-auto" />
                <p className="text-xs text-[#535766] font-semibold mt-4">
                  Loading collections...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-base text-[#282C3F] mb-1">
                  We couldn't find any matches
                </h3>
                <p className="text-xs text-[#535766] mb-6">
                  Please check your search term or try clearing some filters to broaden your search.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-[#FF3F6C] text-white text-xs font-bold uppercase rounded-sm hover:bg-[#e0325d] transition shadow-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex bg-black/50 lg:hidden">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E9ED]">
              <span className="font-bold text-sm uppercase text-[#282C3F]">Filters</span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-[#282C3F] mb-3">Categories</h4>
                <div className="space-y-2 text-xs">
                  {categories.map((c) => (
                    <label key={c._id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="mob-category"
                        checked={selectedCategory === c.slug}
                        onChange={() => {
                          updateParam('category', c.slug);
                          setShowMobileFilters(false);
                        }}
                        className="accent-[#FF3F6C]"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9E9ED] flex space-x-3">
              <button
                onClick={() => {
                  clearAllFilters();
                  setShowMobileFilters(false);
                }}
                className="flex-1 py-2 text-xs font-bold border border-[#E9E9ED] text-[#282C3F] rounded-sm uppercase"
              >
                Clear
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-2 text-xs font-bold bg-[#FF3F6C] text-white rounded-sm uppercase"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
