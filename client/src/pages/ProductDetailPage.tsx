import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { formatPrice, formatDate } from '../lib/utils';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import {
  Store,
  ShoppingCart,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Star,
  CheckCircle2,
  MessageSquare,
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

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { addItem } = useCart();
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
    await addItem(product._id, quantity);
    setIsAdding(false);
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

  const ratingAvg = product.ratingSummary?.average || 0;
  const ratingCount = product.ratingSummary?.count || 0;

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

        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
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

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
                {product.title}
              </h1>

              {/* Rating stars */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(ratingAvg)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {ratingAvg > 0 ? ratingAvg.toFixed(1) : 'No reviews'}
                </span>
                <span className="text-xs text-gray-400">
                  ({ratingCount} verified {ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </div>

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
                  isLoading={isAdding}
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

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-100 mb-8 gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-amber-600" />
                Customer Ratings & Reviews
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Authentic reviews from verified buyers who had this product delivered.
              </p>
            </div>

            {user && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReviewForm((v) => !v)}
              >
                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
              </Button>
            )}
          </div>

          {/* Review Submission Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 mb-8 space-y-4"
            >
              <h3 className="font-bold text-gray-900 text-sm">
                Share Your Product Feedback
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-gray-500 ml-2 font-bold">
                    {reviewRating} out of 5 stars
                  </span>
                </div>
              </div>

              <Input
                label="Headline / Title *"
                placeholder="e.g. Excellent build quality and fast shipping"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Review Details *
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingReview}
                >
                  Submit Verified Review
                </Button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">
                No customer reviews yet. Be the first verified buyer to leave feedback!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="border-b border-gray-100 pb-6 last:border-none"
                >
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
                    <h4 className="font-bold text-gray-900 text-sm">{rev.title}</h4>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                    <span className="font-semibold text-gray-700">{rev.customerName}</span>
                    <span>·</span>
                    <span>{formatDate(rev.createdAt)}</span>
                    {rev.isVerifiedPurchase && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Purchase
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
