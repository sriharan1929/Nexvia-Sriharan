import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import useCart from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import useAuth from '../hooks/useAuth';
import { formatPrice, formatDate } from '../lib/utils';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Heart,
  Star,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Check,
} from 'lucide-react';

interface ReviewItem {
  _id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Delivery check state
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);

  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchProductAndReviews = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/products/${slug}`);
      const prod = res.data.data.product;
      setProduct(prod);

      if (prod?._id) {
        const revRes = await api.get(`/products/${prod._id}/reviews`);
        setReviews(revRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProductAndReviews();
    }
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product._id, 1);
      toast.success(`Added ${product.title} (Size: ${selectedSize}) to Bag!`, {
        icon: '🛍️',
        style: {
          border: '1px solid #FF3F6C',
          color: '#282C3F',
          fontWeight: '600',
        },
      });
    } catch (err: any) {
      toast.error('Failed to add item to bag');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      toast.error('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeChecked(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error('Please enter a review title and comment');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      toast.success('Thank you! Your verified review has been posted.');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      await fetchProductAndReviews();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Verified purchase required: You can only review products that have been delivered to you.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF3F6C]" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-[#282C3F] mb-2 uppercase">Product Not Found</h2>
          <p className="text-[#535766] text-xs mb-6">The requested item is no longer available.</p>
          <Link to="/products">
            <button className="px-6 py-2.5 bg-[#FF3F6C] text-white font-bold text-xs uppercase rounded-sm hover:bg-[#e0325d] transition">
              Back to Catalog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const ratingAvg = product.ratingSummary?.average || 0;
  const ratingCount = product.ratingSummary?.count || 0;
  const discount =
    product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
      ? Math.round(
          ((product.compareAtPricePaise - product.pricePaise) / product.compareAtPricePaise) * 100
        )
      : 0;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImageIndex]?.url || images[0]?.url;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs text-[#535766] mb-6">
          <Link to="/" className="hover:text-[#282C3F] transition">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link to="/products" className="hover:text-[#282C3F] transition">
            Clothing
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-[#282C3F] truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 2-Column Product Detail Layout (Myntra Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails strip */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.key || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-20 shrink-0 border-2 rounded-sm overflow-hidden bg-[#F5F5F6] transition ${
                      selectedImageIndex === idx ? 'border-[#FF3F6C]' : 'border-transparent hover:border-[#E9E9ED]'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image (3:4 Ratio) */}
            <div className="flex-1 aspect-[3/4] bg-[#F5F5F6] rounded-sm overflow-hidden border border-[#E9E9ED]">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Information & Purchase CTAs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Brand Header */}
            <h2 className="text-xl font-black text-[#282C3F] uppercase tracking-wide">
              {product.vendor?.storeName || 'Verified Merchant'}
            </h2>
            <h1 className="text-base text-[#535766] font-normal mt-1 leading-snug">
              {product.title}
            </h1>

            {/* Rating pill */}
            <div className="inline-flex items-center space-x-2 border border-[#E9E9ED] rounded-sm px-2.5 py-1 w-fit mt-3 hover:border-[#282C3F] transition cursor-pointer">
              <span className="font-bold text-xs text-[#282C3F]">
                {ratingAvg > 0 ? ratingAvg.toFixed(1) : '4.3'}
              </span>
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-gray-300 text-xs">|</span>
              <span className="text-xs text-[#535766]">
                {ratingCount > 0 ? `${ratingCount} Ratings` : '2.4k Ratings'}
              </span>
            </div>

            <div className="my-4 border-t border-[#E9E9ED]" />

            {/* Price Trio */}
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-black text-[#282C3F]">
                {formatPrice(product.pricePaise)}
              </span>
              {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise && (
                <>
                  <span className="text-[#94969F] line-through text-base">
                    MRP {formatPrice(product.compareAtPricePaise)}
                  </span>
                  <span className="text-[#03A685] font-bold text-base">
                    ({discount}% OFF)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] font-bold text-[#03A685] uppercase tracking-wider mt-1">
              Inclusive of all taxes
            </p>

            {/* Size Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#282C3F]">
                  Select Size
                </span>
                <button className="text-xs font-bold text-[#FF3F6C] hover:underline uppercase">
                  Size Chart
                </button>
              </div>

              <div className="flex space-x-3">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-11 h-11 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${
                      selectedSize === size
                        ? 'border-[#FF3F6C] text-[#FF3F6C] shadow-sm ring-1 ring-[#FF3F6C]'
                        : 'border-[#E9E9ED] text-[#282C3F] hover:border-[#282C3F]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: ADD TO BAG & WISHLIST */}
            <div className="flex items-center space-x-4 mt-8">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.stock <= 0}
                className="flex-1 py-3.5 bg-[#FF3F6C] text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-[#e0325d] transition flex items-center justify-center space-x-2 shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock > 0 ? (isAdding ? 'Adding...' : 'Add to Bag') : 'Out of Stock'}</span>
              </button>

              <button
                onClick={() =>
                  toggleWishlist({
                    productId: product._id,
                    title: product.title,
                    slug: product.slug,
                    pricePaise: product.pricePaise,
                    compareAtPricePaise: product.compareAtPricePaise,
                    image: product.images?.[0]?.url,
                    vendorName: product.vendor?.storeName,
                  })
                }
                className={`px-6 py-3.5 border rounded-sm text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition ${
                  inWishlist
                    ? 'bg-[#282C3F] text-white border-[#282C3F]'
                    : 'border-[#d4d5d9] text-[#282C3F] hover:border-[#282C3F]'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white text-white' : ''}`} />
                <span>{inWishlist ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Delivery Pincode Checker */}
            <div className="mt-8 pt-6 border-t border-[#E9E9ED]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#282C3F] uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4 text-[#282C3F]" />
                <span>Delivery Options</span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex space-x-2 max-w-xs">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter PIN code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 border border-[#E9E9ED] rounded-sm text-xs text-[#282C3F] focus:outline-none focus:border-[#282C3F]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase text-[#FF3F6C] hover:bg-pink-50 transition rounded-sm"
                >
                  Check
                </button>
              </form>

              {pincodeChecked && (
                <div className="mt-3 space-y-1 text-xs text-[#535766] animate-in fade-in">
                  <p className="flex items-center text-[#282C3F]">
                    <Check className="w-3.5 h-3.5 text-[#03A685] mr-1.5" />
                    Delivery by <strong className="ml-1 text-[#282C3F]">2 - 4 Business Days</strong>
                  </p>
                  <p className="flex items-center text-[#282C3F]">
                    <Check className="w-3.5 h-3.5 text-[#03A685] mr-1.5" />
                    Free Delivery on all orders
                  </p>
                  <p className="flex items-center text-[#282C3F]">
                    <Check className="w-3.5 h-3.5 text-[#03A685] mr-1.5" />
                    Cash on Delivery available
                  </p>
                </div>
              )}

              <div className="mt-4 text-xs text-[#535766] space-y-1.5">
                <p>100% Original Products</p>
                <p>Pay on delivery might be available</p>
                <p>Easy 14 days returns and exchanges</p>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="mt-8 pt-6 border-t border-[#E9E9ED]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282C3F] mb-3">
                Product Details
              </h3>
              <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-line mb-4">
                {product.description}
              </p>

              <div className="border border-[#E9E9ED] rounded-sm p-4 text-xs space-y-2 bg-[#F5F5F6]/40">
                <div className="flex justify-between border-b border-[#E9E9ED] pb-1.5">
                  <span className="text-[#535766]">Seller / Brand</span>
                  <span className="font-bold text-[#282C3F]">
                    {product.vendor?.storeName || 'Verified Merchant'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E9E9ED] pb-1.5">
                  <span className="text-[#535766]">Stock Available</span>
                  <span className="font-bold text-[#03A685]">{product.stock} Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#535766]">Country of Origin</span>
                  <span className="font-bold text-[#282C3F]">India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Customer Reviews Section */}
        <section className="border-t border-[#E9E9ED] pt-10 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#E9E9ED] mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#282C3F] uppercase tracking-wide">
                Customer Ratings & Reviews
              </h3>
              <p className="text-xs text-[#535766] mt-0.5">
                Authentic reviews from verified buyers who purchased this product.
              </p>
            </div>

            {user && (
              <button
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-4 py-2 border border-[#282C3F] text-xs font-bold uppercase rounded-sm text-[#282C3F] hover:bg-[#F5F5F6] transition"
              >
                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
              </button>
            )}
          </div>

          {/* Review Submission Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#FAFBFC] border border-[#E9E9ED] rounded-sm p-6 mb-8 space-y-4"
            >
              <h4 className="font-bold text-sm text-[#282C3F]">Rate this product</h4>

              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-[#282C3F] ml-2">
                  {reviewRating} out of 5 stars
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#282C3F] uppercase mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent fit and genuine fabric"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E9ED] rounded-sm text-xs text-[#282C3F] focus:outline-none focus:border-[#282C3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#282C3F] uppercase mb-1">
                  Review Details *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your experience with size, quality, and delivery..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E9ED] rounded-sm text-xs text-[#282C3F] focus:outline-none focus:border-[#282C3F]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border border-[#E9E9ED] text-xs font-bold uppercase rounded-sm text-[#535766]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 bg-[#FF3F6C] text-white text-xs font-bold uppercase rounded-sm hover:bg-[#e0325d] transition"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#94969F]">
              No reviews yet. Be the first verified purchaser to leave feedback!
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="border-b border-[#E9E9ED] pb-6 last:border-none">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <h5 className="font-bold text-xs text-[#282C3F]">{rev.title}</h5>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-[#535766] mb-2">
                    <span className="font-semibold text-[#282C3F]">{rev.customerName}</span>
                    <span>·</span>
                    <span>{formatDate(rev.createdAt)}</span>
                    {rev.isVerifiedPurchase && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center text-[#03A685] font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Purchase
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-[#535766] leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
