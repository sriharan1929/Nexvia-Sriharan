import { Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, Smartphone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#FAFBFC] border-t border-[#E9E9ED] text-[#282C3F] pt-12 pb-8 mt-16 text-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#E9E9ED]">
          {/* Column 1: Online Shopping */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#282C3F] mb-4">
              Online Shopping
            </h4>
            <ul className="space-y-2 text-[#535766]">
              <li>
                <Link to="/products?category=men" className="hover:text-[#282C3F] transition">
                  Men
                </Link>
              </li>
              <li>
                <Link to="/products?category=women" className="hover:text-[#282C3F] transition">
                  Women
                </Link>
              </li>
              <li>
                <Link to="/products?category=kids" className="hover:text-[#282C3F] transition">
                  Kids
                </Link>
              </li>
              <li>
                <Link to="/products?category=home" className="hover:text-[#282C3F] transition">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link to="/products?category=beauty" className="hover:text-[#282C3F] transition">
                  Beauty
                </Link>
              </li>
              <li>
                <Link to="/products?tag=trending" className="hover:text-[#282C3F] transition">
                  BadaVyapar Studio
                </Link>
              </li>
              <li>
                <Link to="/vendor/apply" className="hover:text-[#FF3F6C] font-semibold transition">
                  Sell On BadaVyapar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Policies */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#282C3F] mb-4">
              Customer Policies
            </h4>
            <ul className="space-y-2 text-[#535766]">
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">Contact Us</span>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">FAQ & Help Center</span>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">T&C</span>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">Terms Of Use</span>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#282C3F] transition">
                  Track Orders
                </Link>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">Shipping & Delivery</span>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">Cancellation & Returns</span>
              </li>
              <li>
                <span className="hover:text-[#282C3F] cursor-pointer">Privacy Policy</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Experience App & Connect */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#282C3F] mb-4">
              Experience Mobile Shopping
            </h4>
            <div className="space-y-3 mb-6">
              <div className="inline-flex items-center px-4 py-2 border border-[#E9E9ED] rounded-sm bg-white hover:bg-gray-50 transition cursor-pointer space-x-2">
                <Smartphone className="w-5 h-5 text-[#282C3F]" />
                <div>
                  <p className="text-[10px] text-gray-400">Available on</p>
                  <p className="font-bold text-xs text-[#282C3F]">Google Play & iOS</p>
                </div>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-[#282C3F] mb-2">
              Keep In Touch
            </h4>
            <div className="flex space-x-3 text-gray-500 font-bold">
              <span className="hover:text-[#FF3F6C] cursor-pointer">Facebook</span>
              <span>·</span>
              <span className="hover:text-[#FF3F6C] cursor-pointer">Twitter</span>
              <span>·</span>
              <span className="hover:text-[#FF3F6C] cursor-pointer">Instagram</span>
            </div>
          </div>

          {/* Column 4: Guarantees */}
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-8 h-8 text-[#282C3F] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-[#282C3F]">100% ORIGINAL guarantee</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  for all products from verified merchants on badavyapar.com
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RotateCcw className="w-8 h-8 text-[#282C3F] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-[#282C3F]">Return within 14 days</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  of receiving your order with easy doorstep pickup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular searches footer strip */}
        <div className="py-6 border-b border-[#E9E9ED] text-[#94969F] text-[11px] leading-relaxed">
          <strong className="text-[#535766]">POPULAR SEARCHES: </strong>
          <span>
            T-Shirts | Pashmina Shawls | Ceramic Dinner Sets | Jaipur Bedspreads | Mechanical Keyboards |
            Gaming Mouse | Dresses | Jeans | Kurtas | Shoes | Bags | Wallets | Watches | Sunglasses
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[#94969F] text-[11px]">
          <p>© 2026 www.badavyapar.com. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium">BadaVyapar Multi-Vendor Enterprise Edition</p>
        </div>
      </div>
    </footer>
  );
}

