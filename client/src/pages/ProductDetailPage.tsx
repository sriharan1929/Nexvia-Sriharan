import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import { Store, ShoppingCart, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data.product);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    toast.success(`Added ${quantity} × ${product.title} to your cart!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-4">The item you are looking for is no longer available.</p>
          <Link to="/products">
            <Button variant="primary">Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/products"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-amber-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
            {/* Image Gallery */}
            <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 font-medium">No Image Available</div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              {/* Store Badge */}
              <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit mb-3">
                <Store className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">Sold by: {product.vendor?.storeName || 'Merchant'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline space-x-3 mb-6">
                <span className="text-3xl font-black text-gray-900">
                  {formatPrice(product.pricePaise)}
                </span>
                <span className="text-xs text-gray-400 font-medium uppercase">
                  Inclusive of all taxes
                </span>
              </div>

              {/* Stock status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                    In Stock ({product.stock} units available)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-b border-gray-100 py-4 mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Product Overview
                </h3>
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="mt-auto space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md py-3 text-base flex items-center justify-center space-x-2"
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span>Add to Cart — {formatPrice(product.pricePaise * quantity)}</span>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Verified Independent Seller</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Secure Multi-Vendor Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
