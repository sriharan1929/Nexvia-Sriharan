import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useCart from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  X,
  Heart,
  ShoppingBag,
  Tag,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function CartPage() {
  const { items, subtotalPaise, itemCount, updateQuantity, removeItem, clearCart, isLoading } =
    useCart();
  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    try {
      setIsValidatingCoupon(true);
      const res = await api.post('/coupons/validate', {
        code,
        subtotalPaise,
      });
      const data = res.data.data;
      setAppliedCoupon({
        code: data.code,
        discountPaise: data.discountPaise,
      });
      toast.success(`Coupon "${data.code}" applied! Saved ${formatPrice(data.discountPaise)}`);
      setCouponCode('');
      setShowCouponModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or ineligible coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast('Coupon removed', { icon: <Info className="w-5 h-5 text-sky-500" /> });
  };

  const handleMoveToWishlist = (item: any) => {
    toggleWishlist({
      productId: item.productId,
      title: item.product.title,
      slug: item.product.slug,
      pricePaise: item.product.pricePaise,
      compareAtPricePaise: item.product.compareAtPricePaise,
      image: item.product.images?.[0]?.url,
      vendorName: item.product.vendor?.storeName,
    });
    removeItem(item.productId);
  };

  const totalMRP = items.reduce((sum, item) => {
    const unitPrice = item.product.compareAtPricePaise || item.product.pricePaise;
    return sum + unitPrice * item.quantity;
  }, 0);

  const discountOnMRP = totalMRP - subtotalPaise;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const finalTotalPaise = Math.max(0, subtotalPaise - couponDiscount);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">

        <div className="flex items-center justify-between pb-6 border-b border-[#E9E9ED] mb-8">
          <div className="flex items-center space-x-2 text-xs font-bold tracking-wider uppercase">
            <span className="text-[#FF3F6C] border-b-2 border-[#FF3F6C] pb-1">1. BAG</span>
            <span className="text-[#94969F]">-----------</span>
            <span className="text-[#94969F]">2. ADDRESS</span>
            <span className="text-[#94969F]">-----------</span>
            <span className="text-[#94969F]">3. PAYMENT</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-[#03A685]">
            <ShieldCheck className="w-4 h-4" />
            <span>100% SECURE CHECKOUT</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF3F6C] mx-auto" />
            <p className="text-xs text-[#535766] font-semibold mt-4">Loading your shopping bag...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F6] flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-[#94969F]" />
            </div>
            <h2 className="text-lg font-bold text-[#282C3F] uppercase tracking-wide mb-2">
              Hey, your bag feels light!
            </h2>
            <p className="text-xs text-[#535766] mb-8 leading-relaxed">
              There is nothing in your bag. Let's add some items from your wishlist or browse the catalog.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/wishlist">
                <button className="w-full sm:w-auto px-6 py-3 border border-[#FF3F6C] text-[#FF3F6C] text-xs font-bold uppercase rounded-sm hover:bg-pink-50 transition">
                  Add Items from Wishlist
                </button>
              </Link>
              <Link to="/products">
                <button className="w-full sm:w-auto px-6 py-3 bg-[#FF3F6C] text-white text-xs font-bold uppercase rounded-sm hover:bg-[#e0325d] transition">
                  Explore Products
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-7 space-y-4">

              <div className="border border-[#E9E9ED] rounded-sm p-3.5 flex items-center justify-between text-xs bg-[#FAFBFC]">
                <div>
                  <span className="text-[#535766]">Deliver to: </span>
                  <strong className="text-[#282C3F]">Bengaluru - 560038</strong>
                </div>
                <button className="font-bold text-[#FF3F6C] uppercase hover:underline">
                  Change Address
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const discount =
                    item.product.compareAtPricePaise &&
                    item.product.compareAtPricePaise > item.product.pricePaise
                      ? Math.round(
                          ((item.product.compareAtPricePaise - item.product.pricePaise) /
                            item.product.compareAtPricePaise) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={item.productId}
                      className="border border-[#E9E9ED] rounded-sm p-4 bg-white flex gap-4 relative"
                    >

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="absolute top-3 right-3 text-[#535766] hover:text-[#282C3F] p-1"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/products/${item.product.slug}`}
                        className="w-24 h-32 aspect-[3/4] bg-[#F5F5F6] rounded-sm overflow-hidden shrink-0"
                      >
                        {item.product.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Pic
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between pr-6">
                        <div>
                          <h4 className="font-bold text-xs uppercase text-[#282C3F] tracking-tight">
                            {item.product.vendor?.storeName || 'Verified Merchant'}
                          </h4>
                          <Link
                            to={`/products/${item.product.slug}`}
                            className="text-xs text-[#535766] line-clamp-1 hover:text-[#FF3F6C] transition mt-0.5"
                          >
                            {item.product.title}
                          </Link>

                          {/* Size & Qty Pickers */}
                          <div className="flex items-center space-x-3 mt-3 text-xs">
                            <span className="font-bold text-[#282C3F] bg-[#F5F5F6] px-2 py-1 rounded-sm">
                              Size: M
                            </span>

                            <div className="flex items-center space-x-1.5 bg-[#F5F5F6] px-2 py-0.5 rounded-sm">
                              <span className="font-bold text-[#282C3F]">Qty:</span>
                              <select
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(item.productId, parseInt(e.target.value, 10))
                                }
                                className="bg-transparent font-bold text-[#282C3F] focus:outline-none cursor-pointer"
                              >
                                {[1, 2, 3, 4, 5].map((q) => (
                                  <option key={q} value={q}>
                                    {q}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex items-baseline space-x-2 text-xs mt-3">
                            <span className="font-bold text-[#282C3F]">
                              {formatPrice(item.lineTotalPaise)}
                            </span>
                            {item.product.compareAtPricePaise &&
                              item.product.compareAtPricePaise > item.product.pricePaise && (
                                <>
                                  <span className="text-[#94969F] line-through text-[11px]">
                                    {formatPrice(item.product.compareAtPricePaise * item.quantity)}
                                  </span>
                                  <span className="text-[#03A685] font-bold text-[11px]">
                                    {discount}% OFF
                                  </span>
                                </>
                              )}
                          </div>
                        </div>

                        {/* Return policy note & Wishlist action */}
                        <div className="pt-3 border-t border-[#F5F5F6] flex items-center justify-between text-[11px]">
                          <span className="text-[#535766] flex items-center">
                            <RotateCcw className="w-3 h-3 mr-1 text-[#03A685]" /> 14 days return
                            available
                          </span>

                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            className="font-bold text-[#FF3F6C] hover:underline uppercase tracking-wider flex items-center"
                          >
                            <Heart className="w-3 h-3 mr-1" /> Move to Wishlist
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear / Continue actions */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <Link to="/products" className="text-[#FF3F6C] font-bold hover:underline">
                  ← Add more items from catalog
                </Link>
                <button
                  onClick={clearCart}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  Clear bag
                </button>
              </div>
            </div>

            {/* Right Column: Coupons & Price Details (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Coupons Box */}
              <div className="border border-[#E9E9ED] rounded-sm p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#535766] flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1.5 text-[#282C3F]" /> Coupons
                  </span>
                  {!appliedCoupon && (
                    <button
                      onClick={() => setShowCouponModal(true)}
                      className="text-xs font-bold text-[#FF3F6C] hover:underline uppercase tracking-wider"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-[#EBF7F2] border border-[#03A685]/30 rounded-sm p-2.5 flex items-center justify-between text-xs text-[#03A685]">
                    <div>
                      <p className="font-bold uppercase tracking-wide">
                        Coupon {appliedCoupon.code} Applied!
                      </p>
                      <p className="text-[11px] text-[#03A685]/80">
                        You saved {formatPrice(appliedCoupon.discountPaise)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-gray-400 hover:text-red-500 font-bold ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code (e.g. SAVE10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-[#E9E9ED] rounded-sm text-xs uppercase tracking-wider font-mono text-[#282C3F] focus:outline-none focus:border-[#282C3F]"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={isValidatingCoupon || !couponCode}
                      className="px-4 py-2 bg-[#FF3F6C] text-white text-xs font-bold uppercase rounded-sm hover:bg-[#e0325d] disabled:opacity-50 transition"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details Card */}
              <div className="border border-[#E9E9ED] rounded-sm p-4 bg-white sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#535766] pb-3 border-b border-[#E9E9ED]">
                  Price Details ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                </h3>

                <div className="py-4 space-y-3 text-xs text-[#282C3F]">
                  <div className="flex justify-between">
                    <span className="text-[#535766]">Total MRP</span>
                    <span>{formatPrice(totalMRP)}</span>
                  </div>

                  {discountOnMRP > 0 && (
                    <div className="flex justify-between text-[#03A685]">
                      <span>Discount on MRP</span>
                      <span>- {formatPrice(discountOnMRP)}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#03A685]">
                      <span>Coupon Discount</span>
                      <span>- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#535766]">Platform Convenience Fee</span>
                    <span className="text-[#03A685] font-semibold">FREE</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#535766]">Shipping Fee</span>
                    <span className="text-[#03A685] font-semibold">FREE</span>
                  </div>

                  <div className="pt-3 border-t border-[#E9E9ED] flex justify-between text-sm font-black text-[#282C3F]">
                    <span>Total Amount</span>
                    <span>{formatPrice(finalTotalPaise)}</span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 bg-[#FF3F6C] text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-[#e0325d] shadow-md transition active:scale-[0.99] flex items-center justify-center space-x-2"
                >
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Available Coupons Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E9ED] mb-4">
              <span className="font-bold text-sm uppercase text-[#282C3F]">Apply Promo Coupon</span>
              <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div
                onClick={() => handleApplyCoupon('SAVE10')}
                className="p-3 border border-dashed border-[#03A685] bg-[#EBF7F2] rounded-sm cursor-pointer hover:bg-green-100 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-[#03A685] bg-white px-2 py-0.5 rounded-sm">
                    SAVE10
                  </span>
                  <span className="text-xs font-bold text-[#03A685]">TAP TO APPLY</span>
                </div>
                <p className="text-xs text-[#282C3F] font-semibold">Get 10% OFF on your entire order</p>
                <p className="text-[10px] text-gray-500">Applicable on orders of ₹1,000 or more</p>
              </div>

              <div
                onClick={() => handleApplyCoupon('FLAT200')}
                className="p-3 border border-dashed border-[#FF3F6C] bg-pink-50 rounded-sm cursor-pointer hover:bg-pink-100 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-[#FF3F6C] bg-white px-2 py-0.5 rounded-sm">
                    FLAT200
                  </span>
                  <span className="text-xs font-bold text-[#FF3F6C]">TAP TO APPLY</span>
                </div>
                <p className="text-xs text-[#282C3F] font-semibold">Flat ₹200 OFF on order subtotal</p>
                <p className="text-[10px] text-gray-500">Applicable on orders of ₹1,500 or more</p>
              </div>
            </div>

            <button
              onClick={() => setShowCouponModal(false)}
              className="w-full py-2.5 border border-[#E9E9ED] text-xs font-bold uppercase rounded-sm text-[#535766]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
