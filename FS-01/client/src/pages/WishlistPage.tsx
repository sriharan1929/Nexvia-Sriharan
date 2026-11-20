import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { useWishlist } from '../hooks/useWishlist';
import useCart from '../hooks/useCart';
import { formatPrice } from '../lib/utils';
import { X, Heart, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeFromWishlist, wishlistCount } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToBag = async (productId: string) => {
    try {
      await addItem(productId, 1);
      removeFromWishlist(productId);
      toast.success('Moved to Bag!', {
        style: {
          border: '1px solid #FF3F6C',
          color: '#282C3F',
          fontWeight: '600',
        },
      });
    } catch (err: any) {
      toast.error('Could not move item to bag');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-8">
        {wishlistCount === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F6] flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-[#94969F]" />
            </div>
            <h2 className="text-xl font-bold text-[#282C3F] tracking-tight mb-2 uppercase">
              Your Wishlist is Empty
            </h2>
            <p className="text-sm text-[#535766] mb-8 leading-relaxed">
              Explore more and shortlist some items. Review them anytime and easily move them to your shopping bag.
            </p>
            <Link to="/products">
              <Button variant="primary" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {/* Wishlist Header */}
            <div className="mb-8">
              <h1 className="text-lg font-bold text-[#282C3F] tracking-tight">
                My Wishlist{' '}
                <span className="text-sm font-normal text-[#535766]">
                  ({wishlistCount} {wishlistCount === 1 ? 'item' : 'items'})
                </span>
              </h1>
            </div>

            {/* 4-Column Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => {
                const discount =
                  item.compareAtPricePaise && item.compareAtPricePaise > item.pricePaise
                    ? Math.round(
                        ((item.compareAtPricePaise - item.pricePaise) / item.compareAtPricePaise) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={item.productId}
                    className="border border-[#E9E9ED] rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative bg-white group"
                  >
                    {/* Remove cross button */}
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm border border-[#E9E9ED] flex items-center justify-center text-gray-500 hover:text-[#282C3F] hover:bg-white z-10 transition"
                      title="Remove from Wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <Link
                      to={`/products/${item.slug}`}
                      className="block aspect-[3/4] bg-[#F5F5F6] overflow-hidden"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
                          No Photo
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="p-3.5 flex-1 flex flex-col">
                      <p className="text-[11px] font-bold text-[#535766] uppercase truncate mb-0.5">
                        {item.vendorName || 'Exclusive Brand'}
                      </p>
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-xs text-[#282C3F] font-medium line-clamp-1 hover:text-[#FF3F6C] transition mb-2"
                      >
                        {item.title}
                      </Link>

                      {/* Pricing */}
                      <div className="mt-auto flex items-baseline space-x-2 text-xs">
                        <span className="font-bold text-[#282C3F]">
                          {formatPrice(item.pricePaise)}
                        </span>
                        {item.compareAtPricePaise && item.compareAtPricePaise > item.pricePaise && (
                          <>
                            <span className="text-[#94969F] line-through text-[11px]">
                              {formatPrice(item.compareAtPricePaise)}
                            </span>
                            <span className="text-[#03A685] font-bold text-[11px]">
                              ({discount}% OFF)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Move to Bag Action Bar */}
                    <button
                      onClick={() => handleMoveToBag(item.productId)}
                      className="w-full py-3 border-t border-[#E9E9ED] text-xs font-bold text-[#FF3F6C] hover:bg-[#FF3F6C] hover:text-white transition flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

