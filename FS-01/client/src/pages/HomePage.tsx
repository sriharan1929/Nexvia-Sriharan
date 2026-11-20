import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import { useWishlist } from '../hooks/useWishlist';
import type { Product } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Tag,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'THE GRAND FASHION FESTIVAL',
    subtitle: '50% - 80% OFF ON TOP BRANDS',
    ctaText: 'SHOP FESTIVE NOW',
    link: '/products?category=women',
    badge: 'EXCLUSIVE DEALS',
    bgColor: 'from-[#1A1A2E] to-[#16213E]',
    accentColor: '#FF3F6C',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    title: 'STREETWEAR & CASUAL ESSENTIALS',
    subtitle: 'MIN. 40% OFF ON HOODIES, TEES & SNEAKERS',
    ctaText: 'EXPLORE MEN WEAR',
    link: '/products?category=men',
    badge: 'NEW ARRIVALS',
    bgColor: 'from-[#0F2027] to-[#203A43]',
    accentColor: '#03A685',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    title: 'AUTHENTIC HANDLOOMS & HERITAGE',
    subtitle: 'KASHMIRI PASHMINAS & JAIPUR COTTON',
    ctaText: 'DISCOVER HANDICRAFTS',
    link: '/products?q=handloom',
    badge: 'MASTER ARTISANS',
    bgColor: 'from-[#2C3E50] to-[#3498DB]',
    accentColor: '#FF905A',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1600&auto=format&fit=crop&q=80',
  },
];

const CATEGORY_TILES = [
  {
    name: 'Men T-Shirts',
    query: 'tshirt',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kurtas & Sarees',
    query: 'kurta',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pashmina Shawls',
    query: 'pashmina',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Keyboards & Tech',
    query: 'keyboard',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cotton Bedsheets',
    query: 'bedspread',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ceramic Tableware',
    query: 'ceramic',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gaming Mice',
    query: 'mouse',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Accessories',
    query: 'accessories',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&auto=format&fit=crop&q=80',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/products?limit=8');
        setFeaturedProducts(res.data.data.products || []);
      } catch (err) {
        console.error('Failed to load featured products', err);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full">

        <div className="relative w-full h-[340px] sm:h-[420px] md:h-[480px] bg-gray-900 overflow-hidden">
          {HERO_SLIDES.map((item, idx) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex items-center">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full">
                  <div className="max-w-xl text-white space-y-3">
                    <span
                      className="inline-block px-3 py-1 rounded-sm text-[10px] sm:text-xs font-bold tracking-widest uppercase"
                      style={{ backgroundColor: item.accentColor }}
                    >
                      {item.badge}
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase">
                      {item.title}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-200 tracking-wide">
                      {item.subtitle}
                    </p>
                    <div className="pt-2">
                      <Link to={item.link}>
                        <button
                          className="px-6 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase rounded-sm text-white shadow-lg transition-transform hover:scale-105"
                          style={{ backgroundColor: item.accentColor }}
                        >
                          {item.ctaText}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Arrows */}
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 hover:bg-white text-gray-800 flex items-center justify-center z-20 shadow-md transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 hover:bg-white text-gray-800 flex items-center justify-center z-20 shadow-md transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide ? 'w-8 bg-[#FF3F6C]' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 2. Circular Category Collections */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
          <div className="text-center mb-8">
            <h3 className="text-lg sm:text-xl font-black text-[#282C3F] tracking-wider uppercase">
              Shop by Category
            </h3>
            <p className="text-xs text-[#535766] mt-0.5">Explore popular departments curated by verified sellers</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-6">
            {CATEGORY_TILES.map((cat) => (
              <Link
                key={cat.name}
                to={`/products?q=${encodeURIComponent(cat.query)}`}
                className="flex flex-col items-center group text-center"
              >
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#FF3F6C] transition-all shadow-sm mb-2 bg-[#F5F5F6]">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#282C3F] group-hover:text-[#FF3F6C] transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Promotional Coupon Spotlight Strip */}
        <section className="bg-gradient-to-r from-[#FF3F6C] to-[#FF905A] py-6 text-white my-4 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Flat Discounts on Multi-Vendor Checkout!
                </h4>
                <p className="text-xs text-white/90">
                  Use code <span className="font-mono font-bold bg-white text-[#FF3F6C] px-1.5 py-0.5 rounded-sm">SAVE10</span> for 10% off or <span className="font-mono font-bold bg-white text-[#FF3F6C] px-1.5 py-0.5 rounded-sm">FLAT200</span> for ₹200 off!
                </p>
              </div>
            </div>

            <Link to="/products">
              <button className="px-5 py-2 bg-white text-[#FF3F6C] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition shadow-sm">
                Apply Coupons Now
              </button>
            </Link>
          </div>
        </section>

        {/* 4. Trending Multi-Vendor Product Rail (3:4 Cards) */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E9E9ED]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#282C3F] tracking-wider uppercase">
                Trending Marketplace Picks
              </h3>
              <p className="text-xs text-[#535766] mt-0.5">Top-selling styles and tech gear from verified merchants</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-[#FF3F6C] hover:underline flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => {
              const inWishlist = isInWishlist(product._id);
              const discount =
                product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
                  ? Math.round(
                      ((product.compareAtPricePaise - product.pricePaise) /
                        product.compareAtPricePaise) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={product._id}
                  className="group border border-[#E9E9ED] rounded-sm bg-white overflow-hidden flex flex-col hover:shadow-lg transition-shadow relative"
                >
                  {/* Wishlist Heart Button */}
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
                        : 'bg-white/90 text-[#282C3F] hover:bg-white'
                    }`}
                    title="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
                  </button>

                  {/* 3:4 Aspect Ratio Product Image */}
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
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Picture
                      </div>
                    )}

                    {/* Rating Pill overlay */}
                    {product.ratingSummary && product.ratingSummary.count > 0 && (
                      <div className="absolute bottom-2.5 left-2.5 bg-white/90 px-1.5 py-0.5 rounded-sm text-[10px] font-bold text-[#282C3F] flex items-center space-x-1 shadow-sm">
                        <span>{product.ratingSummary.average.toFixed(1)}</span>
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{product.ratingSummary.count}</span>
                      </div>
                    )}
                  </Link>

                  {/* Product Metadata */}
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

                    <div className="mt-2.5 flex items-baseline space-x-2 text-xs">
                      <span className="font-bold text-[#282C3F]">
                        {formatPrice(product.pricePaise)}
                      </span>
                      {product.compareAtPricePaise &&
                        product.compareAtPricePaise > product.pricePaise && (
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
            })}
          </div>
        </section>

        {/* 5. Trust & Assurance Section */}
        <section className="bg-[#F5F5F6] py-12 border-t border-[#E9E9ED]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-sm border border-[#E9E9ED] flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#FF3F6C]/10 flex items-center justify-center text-[#FF3F6C] shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#282C3F] mb-1">100% Verified Sellers</h4>
                  <p className="text-xs text-[#535766] leading-relaxed">
                    Every merchant profile is reviewed and vetted by marketplace administrators before listing products.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-sm border border-[#E9E9ED] flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#03A685]/10 flex items-center justify-center text-[#03A685] shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#282C3F] mb-1">Decoupled Order Tracking</h4>
                  <p className="text-xs text-[#535766] leading-relaxed">
                    One single checkout for multi-vendor items. Each seller dispatches and tracks their items independently.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-sm border border-[#E9E9ED] flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#FF905A]/10 flex items-center justify-center text-[#FF905A] shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#282C3F] mb-1">Automated Route Settlements</h4>
                  <p className="text-xs text-[#535766] leading-relaxed">
                    Powered by Razorpay Route. Transparent platform commission with automated payouts to seller bank accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
