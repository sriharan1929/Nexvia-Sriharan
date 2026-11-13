import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useCart from '../hooks/useCart';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';
import { Store, ShieldCheck, ArrowLeft, CreditCard } from 'lucide-react';

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

export default function CheckoutPage() {
  const { items, subtotalPaise, itemCount, vendorCount, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      name: 'Priya Sharma',
      line1: 'Flat 402, Lotus Residency, MG Road',
      line2: 'Near Indiranagar Metro',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '9876543210',
    },
  });

  // Group items by vendor for review
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

  const onSubmit = async (addressData: CheckoutAddressFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/checkout/session', {
        address: addressData,
      });

      const { order } = res.data.data;
      toast.success(`Order #${order.orderNumber} placed successfully!`);
      await clearCart();
      navigate(`/orders/${order._id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to place order. Please check stock.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/products">
            <Button variant="primary">Browse Marketplace</Button>
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
            to="/cart"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-amber-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Cart
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">
            Multi-Vendor Checkout
          </h1>
          <p className="text-sm text-gray-500">
            One single payment. Independent fulfillment and tracking from {vendorCount} {vendorCount === 1 ? 'seller' : 'sellers'}.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Shipping Address Form & Items Review */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  1. Shipping & Delivery Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Recipient Full Name *"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Flat, House no., Building, Street address *"
                      error={errors.line1?.message}
                      {...register('line1')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Apartment, Landmark, Suite (Optional)"
                      error={errors.line2?.message}
                      {...register('line2')}
                    />
                  </div>

                  <Input
                    label="City *"
                    error={errors.city?.message}
                    {...register('city')}
                  />

                  <Input
                    label="State *"
                    error={errors.state?.message}
                    {...register('state')}
                  />

                  <Input
                    label="PIN Code (6 Digits) *"
                    placeholder="560038"
                    error={errors.pincode?.message}
                    {...register('pincode')}
                  />

                  <Input
                    label="Mobile Phone *"
                    placeholder="9876543210"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
              </div>

              {/* Vendor Packages Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  2. Review Shipments by Vendor
                </h2>

                <div className="space-y-4">
                  {Object.entries(vendorGroups).map(([vId, group]) => (
                    <div
                      key={vId}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                    >
                      <div className="flex items-center text-xs font-bold text-amber-800 mb-3">
                        <Store className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        <span>Shipment Package from: {group.vendorName}</span>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-none"
                          >
                            <span className="text-gray-700 font-medium">
                              {item.quantity} × {item.product.title}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(item.lineTotalPaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary & Place Order */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 mb-4">
                  Payment Summary
                </h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Subtotal ({itemCount} items)</span>
                    <span className="font-semibold text-gray-800">{formatPrice(subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charges</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatPrice(subtotalPaise)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-3 shadow-md"
                >
                  <CreditCard className="w-5 h-5 mr-1.5" />
                  <span>Place Order & Pay {formatPrice(subtotalPaise)}</span>
                </Button>

                <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>256-bit Secure Razorpay Payment Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
