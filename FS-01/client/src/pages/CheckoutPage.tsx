import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useCart from '../hooks/useCart';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  Store,
  ShieldCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Tag,
  X,
  Home,
  Briefcase,
  Lock,
  PackageCheck,
  Check,
  Info,
} from 'lucide-react';

const checkoutAddressSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(100),
  line1: z.string().min(5, 'Street address is required').max(200),
  line2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'),
  phone: z
    .string()
    .min(10, 'Contact phone must have at least 10 digits')
    .max(15),
});

type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>;

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { items, subtotalPaise, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'simulate' | 'razorpay'>('simulate');
  const [addressType, setAddressType] = useState<'HOME' | 'WORK'>('HOME');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
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
      setCouponInput('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast('Coupon removed', { icon: <Info className="w-5 h-5 text-sky-500" /> });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      name: 'Priya Sharma',
      line1: 'Flat 402, Lotus Residency, 12th Main Road',
      line2: 'Near Indiranagar Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '9876543210',
    },
  });

  const vendorGroups = items.reduce<Record<string, { vendorName: string; items: typeof items }>>(
    (acc, item) => {
      const vendorId = item.product.vendor?._id || 'unknown';
      const vendorName = item.product.vendor?.storeName || 'Verified Fashion Merchant';

      if (!acc[vendorId]) {
        acc[vendorId] = { vendorName, items: [] };
      }
      acc[vendorId].items.push(item);
      return acc;
    },
    {}
  );

  const onSubmit = async (addressData: CheckoutAddressFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setIsSubmitting(true);
    try {

      const sessionRes = await api.post('/checkout/session', {
        address: {
          ...addressData,
          line2: addressData.line2 ? `${addressData.line2} [${addressType}]` : `[${addressType}]`,
        },
        couponCode: appliedCoupon?.code,
      });

      const { order, razorpayOrderId, keyId, amountPaise } = sessionRes.data.data;

      // 2. Handle Payment
      if (paymentMethod === 'simulate' || !keyId || keyId.includes('mock')) {
        // Fast instant simulation mode
        await api.post('/payments/simulate', { orderId: order._id });
        toast.success(`Payment captured! Order #${order.orderNumber} placed successfully.`);
        await clearCart();
        navigate(`/orders/${order._id}`);
        return;
      }

      // Live Razorpay Checkout Modal
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Unable to load Razorpay SDK. Falling back to test checkout.');
        await api.post('/payments/simulate', { orderId: order._id });
        toast.success(`Order #${order.orderNumber} placed successfully!`);
        await clearCart();
        navigate(`/orders/${order._id}`);
        return;
      }

      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'Market Zone Fashion',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrderId.startsWith('order_mock') ? undefined : razorpayOrderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/razorpay/verify', {
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(`Payment verified! Order #${order.orderNumber} confirmed.`);
            await clearCart();
            navigate(`/orders/${order._id}`);
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
            navigate(`/orders/${order._id}`);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. You can complete payment from Order Details.', { icon: <Info className="w-5 h-5 text-sky-500" /> });
            navigate(`/orders/${order._id}`);
          },
        },
        prefill: {
          name: addressData.name,
          contact: addressData.phone,
        },
        theme: {
          color: '#FF3F6C',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to complete checkout. Please review items.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex flex-col font-sans">
        {/* Minimal Checkout Header */}
        <header className="bg-white border-b border-[#E9E9ED] py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-[#FF3F6C] to-[#FF905A] flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-lg tracking-tight">M</span>
              </div>
              <span className="font-black text-lg tracking-wider text-[#282C3F]">MARKET ZONE</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-[#E9E9ED]">
            <PackageCheck className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-[#282C3F] mb-1">Your bag is empty!</h2>
          <p className="text-sm text-[#535766] mb-6">There are no items left in your bag to checkout.</p>
          <Link to="/products">
            <Button variant="primary" size="lg">CONTINUE SHOPPING</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6] flex flex-col font-sans antialiased text-[#282C3F]">
      {/* 1. Myntra Distraction-Free Stepped Checkout Header */}
      <header className="bg-white border-b border-[#E9E9ED] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-[#FF3F6C] to-[#FF905A] flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-lg tracking-tight">M</span>
            </div>
            <span className="font-black text-lg tracking-wider text-[#282C3F] hidden sm:inline">MARKET ZONE</span>
          </Link>

          {/* Stepped Progress Bar */}
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-bold tracking-widest uppercase">
            <Link to="/cart" className="text-[#03A685] hover:underline flex items-center">
              <span>BAG</span>
              <Check className="w-3.5 h-3.5 ml-1 text-[#03A685]" />
            </Link>
            <span className="text-gray-300 font-normal">----------</span>
            <span className="text-[#FF3F6C] border-b-2 border-[#FF3F6C] pb-0.5">ADDRESS</span>
            <span className="text-gray-300 font-normal">----------</span>
            <span className="text-[#535766]">PAYMENT</span>
          </div>

          {/* 100% Secure Badge */}
          <div className="flex items-center text-xs font-semibold text-[#535766]">
            <ShieldCheck className="w-5 h-5 text-[#03A685] mr-1.5" />
            <span className="hidden md:inline tracking-wider uppercase text-[11px]">100% SECURE</span>
          </div>
        </div>
      </header>

      {/* 2. Main Checkout Form Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Delivery Address, Multi-Vendor Packages, Payment Mode */}
            <div className="lg:col-span-7 space-y-6">

              {/* Step 1: Address Card */}
              <div className="bg-white border border-[#E9E9ED] rounded-sm p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E9E9ED]">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#282C3F]">
                    Delivery Address
                  </h2>
                  <span className="text-xs text-[#03A685] font-semibold bg-[#E8F8F5] px-2 py-0.5 rounded-xs">
                    Free Express Delivery
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Priya Sharma"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                        Mobile Number *
                      </label>
                      <Input
                        placeholder="10-digit mobile number"
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                        Pincode (6 Digits) *
                      </label>
                      <Input
                        placeholder="e.g. 560038"
                        error={errors.pincode?.message}
                        {...register('pincode')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                      Address (House No, Building, Street) *
                    </label>
                    <Input
                      placeholder="e.g. Flat 402, Lotus Residency, 12th Main Road"
                      error={errors.line1?.message}
                      {...register('line1')}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                      Locality / Town / Landmark (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Near Indiranagar Metro Station"
                      error={errors.line2?.message}
                      {...register('line2')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                        City / District *
                      </label>
                      <Input
                        placeholder="e.g. Bengaluru"
                        error={errors.city?.message}
                        {...register('city')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-1">
                        State *
                      </label>
                      <Input
                        placeholder="e.g. Karnataka"
                        error={errors.state?.message}
                        {...register('state')}
                      />
                    </div>
                  </div>

                  {/* Address Type Selection Pills */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#535766] mb-2">
                      Save Address As
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setAddressType('HOME')}
                        className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold tracking-wide transition cursor-pointer ${
                          addressType === 'HOME'
                            ? 'border-[#FF3F6C] text-[#FF3F6C] bg-pink-50/50'
                            : 'border-[#E9E9ED] text-[#535766] hover:border-[#282C3F]'
                        }`}
                      >
                        <Home className="w-3.5 h-3.5 mr-1.5" />
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressType('WORK')}
                        className={`flex items-center px-4 py-2 border rounded-full text-xs font-bold tracking-wide transition cursor-pointer ${
                          addressType === 'WORK'
                            ? 'border-[#FF3F6C] text-[#FF3F6C] bg-pink-50/50'
                            : 'border-[#E9E9ED] text-[#535766] hover:border-[#282C3F]'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                        Work
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Multi-Vendor Packages Preview */}
              <div className="bg-white border border-[#E9E9ED] rounded-sm p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E9E9ED]">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#282C3F]">
                    Order Shipments ({Object.keys(vendorGroups).length} Seller Package{Object.keys(vendorGroups).length > 1 ? 's' : ''})
                  </h2>
                  <span className="text-xs text-[#535766]">
                    Dispatched separately by verified sellers
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(vendorGroups).map(([vId, group], idx) => (
                    <div
                      key={vId}
                      className="border border-[#E9E9ED] rounded-sm p-4 bg-[#F5F5F6]/40"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#282C3F] mb-3 pb-2 border-b border-gray-200">
                        <div className="flex items-center space-x-1.5">
                          <Store className="w-4 h-4 text-[#FF3F6C]" />
                          <span>Package {idx + 1}: Dispatched by {group.vendorName}</span>
                        </div>
                        <span className="text-[11px] text-[#03A685] font-semibold">
                          Estimated Delivery: 2–4 Business Days
                        </span>
                      </div>

                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <div className="flex items-center space-x-3">
                              {item.product.images?.[0]?.url ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.title}
                                  className="w-10 h-12 object-cover rounded-xs border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-12 bg-gray-100 rounded-xs flex items-center justify-center text-[10px] text-gray-400">
                                  3:4
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-[#282C3F] line-clamp-1">{item.product.title}</p>
                                <p className="text-[11px] text-[#535766]">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-bold text-[#282C3F]">
                              {formatPrice(item.lineTotalPaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Method Options */}
              <div className="bg-white border border-[#E9E9ED] rounded-sm p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E9E9ED]">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#282C3F]">
                    Payment Mode
                  </h2>
                  <span className="flex items-center text-xs text-[#535766]">
                    <Lock className="w-3 h-3 mr-1 text-[#03A685]" /> 100% Encrypted
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Mode A: Instant Demo Payment */}
                  <div
                    onClick={() => setPaymentMethod('simulate')}
                    className={`cursor-pointer rounded-sm border-2 p-4 transition flex items-start justify-between ${
                      paymentMethod === 'simulate'
                        ? 'border-[#FF3F6C] bg-pink-50/20'
                        : 'border-[#E9E9ED] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === 'simulate'
                              ? 'border-[#FF3F6C]'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'simulate' && (
                            <div className="w-2 h-2 rounded-full bg-[#FF3F6C]" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#282C3F] text-xs">
                            Instant Demo Payment (Recommended)
                          </span>
                          <span className="bg-[#03A685]/10 text-[#03A685] text-[10px] font-bold px-1.5 py-0.2 rounded-xs uppercase">
                            Instant Capture
                          </span>
                        </div>
                        <p className="text-[11px] text-[#535766] mt-1">
                          Simulates successful capture and creates multi-vendor split ledger records & tax invoices immediately without OTP friction.
                        </p>
                      </div>
                    </div>
                    <Sparkles className="w-5 h-5 text-[#FF905A] shrink-0" />
                  </div>

                  {/* Mode B: Razorpay Route Gateway */}
                  <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`cursor-pointer rounded-sm border-2 p-4 transition flex items-start justify-between ${
                      paymentMethod === 'razorpay'
                        ? 'border-[#FF3F6C] bg-pink-50/20'
                        : 'border-[#E9E9ED] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === 'razorpay'
                              ? 'border-[#FF3F6C]'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'razorpay' && (
                            <div className="w-2 h-2 rounded-full bg-[#FF3F6C]" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#282C3F] text-xs">
                            Razorpay Route Gateway (UPI / Cards / NetBanking)
                          </span>
                        </div>
                        <p className="text-[11px] text-[#535766] mt-1">
                          Official Razorpay gateway with test sandbox cards, Google Pay, PhonePe, Paytm, and net banking support.
                        </p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Sticky Price Details & Place Order */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-[#E9E9ED] rounded-sm p-6 sticky top-24 shadow-xs space-y-6">

                {/* Coupons Box */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#535766] mb-2 flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1.5 text-[#FF3F6C]" /> Coupons & Offers
                  </h3>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-[#E8F8F5] border border-[#03A685]/30 rounded-xs p-2.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#03A685]" />
                        <div>
                          <p className="font-bold text-xs text-[#03A685] uppercase tracking-wide">
                            {appliedCoupon.code} Applied
                          </p>
                          <p className="text-[11px] text-[#535766]">
                            Saved {formatPrice(appliedCoupon.discountPaise)} on this order
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                        title="Remove coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="ENTER COUPON CODE"
                          className="flex-1 px-3 py-2 border border-[#E9E9ED] rounded-xs text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#282C3F]"
                        />
                        <button
                          type="button"
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2 bg-[#FF3F6C] text-white text-xs font-bold uppercase rounded-xs hover:bg-[#e0325d] disabled:opacity-50 transition cursor-pointer"
                        >
                          {isValidatingCoupon ? '...' : 'APPLY'}
                        </button>
                      </div>

                      {/* Quick Coupon Suggestions */}
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[10px] text-[#535766]">Available:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon('SAVE10')}
                          className="text-[10px] font-bold text-[#FF3F6C] border border-dashed border-[#FF3F6C] px-2 py-0.5 rounded-xs hover:bg-pink-50 cursor-pointer uppercase"
                        >
                          SAVE10 (10% Off)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon('FLAT200')}
                          className="text-[10px] font-bold text-[#FF3F6C] border border-dashed border-[#FF3F6C] px-2 py-0.5 rounded-xs hover:bg-pink-50 cursor-pointer uppercase"
                        >
                          FLAT200 (₹200 Off)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E9E9ED]" />

                {/* Myntra Standard Price Details Breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#535766] mb-4">
                    PRICE DETAILS ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-[#282C3F]">
                      <span>Total MRP</span>
                      <span>{formatPrice(subtotalPaise)}</span>
                    </div>

                    {discountPaise > 0 && (
                      <div className="flex justify-between text-[#03A685]">
                        <span>Coupon Discount</span>
                        <span className="font-semibold">-{formatPrice(discountPaise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#282C3F]">
                      <span>Convenience / Delivery Fee</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="line-through text-gray-400">₹99</span>
                        <span className="text-[#03A685] font-bold uppercase">FREE</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[#282C3F]">
                      <span>Platform Fee</span>
                      <span className="text-[#03A685] font-bold uppercase">FREE</span>
                    </div>

                    <div className="border-t border-[#E9E9ED] pt-3 flex justify-between text-sm font-bold text-[#282C3F]">
                      <span>Total Amount</span>
                      <span className="text-base text-[#282C3F]">{formatPrice(finalTotalPaise)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full tracking-wider shadow-sm text-sm py-3.5"
                >
                  {paymentMethod === 'simulate' ? 'CONFIRM & PLACE ORDER' : 'PROCEED TO RAZORPAY'}
                </Button>

                {/* Trust Footer */}
                <div className="pt-2 border-t border-[#E9E9ED] text-[11px] text-[#535766] space-y-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#03A685] shrink-0" />
                    <span>100% Safe & Secure Payments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PackageCheck className="w-4 h-4 text-[#03A685] shrink-0" />
                    <span>Free Delivery & 14-Day Return Guarantee</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}
