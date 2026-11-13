import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import type { Product, Category } from '../types';
import { Search, Store, ArrowUpDown } from 'lucide-react';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters from URL
  const q = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [searchTerm, setSearchTerm] = useState(q);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (q) queryParams.set('q', q);
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (sort) queryParams.set('sort', sort);

        const [prodRes, catRes] = await Promise.all([
          api.get(`/products?${queryParams.toString()}`),
          api.get('/categories'),
        ]);

        setProducts(prodRes.data.data || []);
        setCategories(catRes.data.data || []);
      } catch (error) {
        console.error('Failed to load catalog data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, [q, selectedCategory, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set('q', searchTerm.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (catSlug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (catSlug) {
      newParams.set('category', catSlug);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
            Marketplace Catalog
          </h1>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search products by title, tag, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:border-amber-500 focus:outline-none shadow-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </form>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:border-amber-500 focus:outline-none bg-white shadow-sm"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2 text-xs font-semibold">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                !selectedCategory
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => handleCategoryChange(c.slug)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                  selectedCategory === c.slug
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-base mb-2">No matching products found.</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search terms or clearing your category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod) => (
              <Link
                key={prod._id}
                to={`/products/${prod.slug}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col group"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  {prod.images?.[0]?.url ? (
                    <img
                      src={prod.images[0].url}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                      No Image
                    </div>
                  )}
                  {prod.stock <= 5 && prod.stock > 0 && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Only {prod.stock} left
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  {/* Seller Store Name */}
                  <div className="flex items-center text-xs text-amber-700 mb-1 font-medium">
                    <Store className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    <span>{prod.vendor?.storeName || 'Verified Merchant'}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-amber-600 transition line-clamp-2 mb-2">
                    {prod.title}
                  </h3>

                  <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100">
                    <div>
                      <span className="text-base font-extrabold text-gray-900">
                        {formatPrice(prod.pricePaise)}
                      </span>
                    </div>
                    <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                      In Stock
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

