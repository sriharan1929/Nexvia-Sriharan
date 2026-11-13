import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import useCart from '../hooks/useCart';
import { formatPrice } from '../lib/utils';
import { Trash2, Store, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, subtotalPaise, itemCount, vendorCount, updateQuantity, removeItem, clearCart, isLoading } =
    useCart();
  const navigate = useNavigate();

  // Group items by vendor
  const vendorGroups = items.reduce<Record<string, { vendorName: string; items: typeof items }>>(
    (acc, item) => {
      const vendorId = item.product.vendor?._id || 'unknown';
      const vendorName = item.product.vendor?.storeName || 'Verified Merchant';

      if (!acc[vendorId]) {
        acc[vendorId] = { vendorName, items: [] };
      }
      acc[vendorId].items.push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Your Shopping Cart
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          One unified payment. Each vendor fulfills and ships their own items independently.
        </p>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-500 mb-6">
              Looks like you haven't added anything to your cart yet. Explore our wide selection of products from sellers across India.
            </p>
            <Link to="/products">
              <Button variant="primary" size="lg" className="w-full">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List Grouped by Vendor */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(vendorGroups).map(([vId, group]) => (
                <div
                  key={vId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Vendor Header */}
                  <div className="bg-amber-50/50 px-6 py-3 border-b border-amber-100/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm font-bold text-amber-900">
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Shipment from: {group.vendorName}</span>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Items in this Vendor's Package */}
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div
                        key={item.productId}
                        className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={
                              item.product.images?.[0]?.url ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
                            }
                            alt={item.product.title}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                          />
                          <div>
                            <Link
                              to={`/products/${item.product.slug}`}
                              className="font-bold text-gray-900 hover:text-amber-600 text-sm line-clamp-1"
                            >
                              {item.product.title}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Unit Price: {formatPrice(item.product.pricePaise)}
                            </p>
                            <p className="text-xs font-semibold text-gray-800 mt-1">
                              Line Total: {formatPrice(item.lineTotalPaise)}
                            </p>
                          </div>
                        </div>

                        {/* Quantity and Remove */}
                        <div className="flex items-center space-x-4 self-end sm:self-center">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold rounded-l-lg"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-bold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold rounded-r-lg"
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                            title="Remove from Cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <Link
                  to="/products"
                  className="text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  ← Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-xs text-gray-500 hover:text-red-600 transition"
                >
                  Clear entire cart
                </button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Items</span>
                    <span className="font-semibold text-gray-800">{itemCount} units</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Participating Sellers</span>
                    <span className="font-semibold text-gray-800">
                      {vendorCount} {vendorCount === 1 ? 'Store' : 'Independent Stores'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      {formatPrice(subtotalPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Standard Delivery</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                    <span>Estimated Total</span>
                    <span>{formatPrice(subtotalPaise)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Applicable GST and coupons calculated at checkout.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center space-x-2 shadow-md py-3"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
