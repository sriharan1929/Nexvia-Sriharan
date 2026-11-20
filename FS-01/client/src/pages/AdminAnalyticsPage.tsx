import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Tag,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('500');
  const [validDays, setValidDays] = useState('30');
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, couponsRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/coupons'),
      ]);
      setMetrics(analyticsRes.data.data.metrics);
      setRecentOrders(analyticsRes.data.data.recentOrders || []);
      setCoupons(couponsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load admin analytics:', error);
      toast.error('Failed to load admin analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) {
      toast.error('Please enter a coupon code and discount value');
      return;
    }

    try {
      setIsSubmittingCoupon(true);
      const validUntil = new Date(Date.now() + parseInt(validDays, 10) * 24 * 60 * 60 * 1000);

      const payload: any = {
        code: code.trim().toUpperCase(),
        type,
        usageLimit: parseInt(usageLimit, 10) || 500,
        validFrom: new Date(),
        validUntil,
        minOrderPaise: minOrder ? Math.round(parseFloat(minOrder) * 100) : 0,
      };

      if (type === 'PERCENTAGE') {
        payload.percentage = parseFloat(value);
        if (maxDiscount) {
          payload.maxDiscountPaise = Math.round(parseFloat(maxDiscount) * 100);
        }
      } else {
        payload.valuePaise = Math.round(parseFloat(value) * 100);
      }

      await api.post('/admin/coupons', payload);
      toast.success(`Coupon ${payload.code} created successfully!`);
      setShowCouponModal(false);
      setCode('');
      setValue('');
      setMinOrder('');
      setMaxDiscount('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setIsSubmittingCoupon(false);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Navigation Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Marketplace Control Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Platform-wide GMV, commissions, promotional coupons, and seller settlements.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/admin/vendors">
              <Button variant="secondary" size="md">
                <Users className="w-4 h-4 mr-1.5" /> Seller Approvals
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCouponModal(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Promo Coupon
            </Button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Merchandise Value (GMV)</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatPrice(metrics?.gmvPaise || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">From {metrics?.paidOrdersCount || 0} completed orders</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {formatPrice(metrics?.platformCommissionPaise || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Retained marketplace revenue</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vendor Net Payouts</span>
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600">
              {formatPrice(metrics?.vendorNetPayoutsPaise || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Transferred to linked vendor accounts</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Catalog</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">
              {metrics?.activeProductsCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Listed by {metrics?.approvedVendorsCount || 0} approved sellers</p>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center">
              <Tag className="w-4 h-4 mr-2 text-amber-600" />
              Promotional Coupons ({coupons.length})
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCouponModal(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Coupon
            </Button>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No promo coupons created yet. Create codes like <code>SAVE10</code> or <code>WELCOME100</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Coupon Code</th>
                    <th className="py-3 px-6">Discount</th>
                    <th className="py-3 px-6">Min Order</th>
                    <th className="py-3 px-6">Usage</th>
                    <th className="py-3 px-6">Valid Until</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-6 font-mono font-bold text-amber-700">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        {c.type === 'PERCENTAGE'
                          ? `${c.percentage}% OFF`
                          : `${formatPrice(c.valuePaise)} FLAT`}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600">
                        {c.minOrderPaise > 0 ? formatPrice(c.minOrderPaise) : 'None'}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600">
                        {c.usedCount} / {c.usageLimit}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600">
                        {formatDate(c.validUntil)}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Marketplace Orders</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Order ID</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Total Paid</th>
                    <th className="py-3 px-6">Payment</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-6 font-mono font-semibold text-gray-900">
                        <Link to={`/orders/${ord._id}`} className="hover:text-amber-600">
                          #{ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-6 text-gray-700">
                        {ord.addressSnapshot?.name || (ord.customerId as any)?.name || 'Customer'}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-gray-900">
                        {formatPrice(ord.totalPaise)}
                      </td>
                      <td className="py-3.5 px-6">
                        {ord.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-gray-500 text-xs">
                        {formatDate(ord.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Coupon Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create Promo Coupon</h3>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <Input
                  label="Coupon Code *"
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <Input
                    label={type === 'PERCENTAGE' ? 'Percentage (%) *' : 'Amount (₹) *'}
                    type="number"
                    placeholder={type === 'PERCENTAGE' ? '10' : '150'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Order (₹)"
                    type="number"
                    placeholder="e.g. 500"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />

                  {type === 'PERCENTAGE' ? (
                    <Input
                      label="Max Discount (₹)"
                      type="number"
                      placeholder="e.g. 200"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                    />
                  ) : (
                    <Input
                      label="Usage Limit"
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                    />
                  )}
                </div>

                <Input
                  label="Valid Duration (Days)"
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                />

                <div className="flex justify-end space-x-3 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowCouponModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmittingCoupon}
                  >
                    Create Coupon
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
