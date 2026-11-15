import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { formatPrice } from '../lib/utils';
import type { Product } from '../types';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product._id);

  const discount =
    product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
      ? Math.round(
          ((product.compareAtPricePaise - product.pricePaise) / product.compareAtPricePaise) * 100
        )
      : 0;

  return (
    <div className="group border border-[#E9E9ED] rounded-sm bg-white overflow-hidden flex flex-col hover:shadow-lg transition-all relative">
      {/* Wishlist Heart Toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist({
            productId: product._id,
            title: product.title,
            slug: product.slug,
            pricePaise: product.pricePaise,
            compareAtPricePaise: product.compareAtPricePaise,
            image: product.images?.[0]?.url,
            vendorName: product.vendor?.storeName,
          });
        }}
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full border border-[#E9E9ED] flex items-center justify-center transition z-10 ${
          inWishlist
            ? 'bg-[#FF3F6C] text-white border-[#FF3F6C]'
            : 'bg-white/90 text-[#282C3F] hover:bg-white hover:text-[#FF3F6C]'
        }`}
        title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
      </button>

      {/* 3:4 Aspect Ratio Image Container */}
      <Link
        to={`/products/${product.slug}`}
        className="block aspect-[3/4] bg-[#F5F5F6] overflow-hidden relative"
      >
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
            No Photo
          </div>
        )}

        {/* Rating Pill overlay */}
        {product.ratingSummary && product.ratingSummary.count > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-[#282C3F] flex items-center space-x-1 shadow-sm">
            <span>{product.ratingSummary.average.toFixed(1)}</span>
            <span className="text-amber-500">★</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{product.ratingSummary.count}</span>
          </div>
        )}
      </Link>

      {/* Details Box */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-[11px] font-bold text-[#535766] uppercase truncate tracking-tight mb-0.5">
            {product.vendor?.storeName || 'Verified Merchant'}
          </h4>
          <Link
            to={`/products/${product.slug}`}
            className="text-xs text-[#282C3F] font-medium line-clamp-1 hover:text-[#FF3F6C] transition"
            title={product.title}
          >
            {product.title}
          </Link>
        </div>

        {/* Pricing Trio */}
        <div className="mt-2.5 flex items-baseline space-x-2 text-xs">
          <span className="font-bold text-[#282C3F]">
            {formatPrice(product.pricePaise)}
          </span>
          {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise && (
            <>
              <span className="text-[#94969F] line-through text-[11px]">
                {formatPrice(product.compareAtPricePaise)}
              </span>
              <span className="text-[#03A685] font-bold text-[11px]">
                ({discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

