import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Package, Truck, Check, ArrowRight } from 'lucide-react';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Ship modal state
  const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchVendorOrders = async () => {
    try {
      setIsLoading(true);
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/vendor/orders${query}`);
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Failed to load seller orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, [statusFilter]);

  const handleStatusTransition = async (
    sellerOrderId: string,
    newStatus: string,
    trackNum?: string,
    trackUrl?: string
  ) => {
    try {
      setIsUpdating(true);
      await api.patch(`/vendor/seller-orders/${sellerOrderId}/status`, {
        status: newStatus,
        trackingNumber: trackNum,
        trackingUrl: trackUrl,
      });
      toast.success(`Shipment updated to ${newStatus}!`);
      setShippingModalOrder(null);
      setTrackingNumber('');
      setTrackingUrl('');
      fetchVendorOrders();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to update fulfillment status'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    handleStatusTransition(
      shippingModalOrder._id,
      'SHIPPED',
      trackingNumber,
      trackingUrl
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Seller Order Fulfillment
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fulfill your assigned customer orders, update shipment states, and monitor net earnings.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 text-xs font-semibold overflow-x-auto">
            {['', 'PLACED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st || 'ALL ORDERS'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No seller orders found for filter: {statusFilter || 'ALL'}.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((so) => (
              <div
                key={so._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-gray-500 block">ORDER NUMBER</span>
                      <span className="font-mono font-bold text-gray-900">
                        #{so.orderId?.orderNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">ORDER DATE</span>
                      <span className="font-semibold text-gray-800">{formatDate(so.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">SHIP TO</span>
                      <span className="font-semibold text-gray-800">
                        {so.orderId?.addressSnapshot?.name} ({so.orderId?.addressSnapshot?.city},{' '}
                        {so.orderId?.addressSnapshot?.state})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Fulfillment: {so.fulfillmentStatus}
                    </span>
                  </div>
                </div>

                {/* Items & Financials */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items to Pack */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Items to Fulfill ({so.items?.length || 0})
                    </h3>
                    {so.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none text-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {item.productSnapshot.image && (
                            <img
                              src={item.productSnapshot.image}
                              alt=""
                              className="w-10 h-10 object-cover rounded border"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-gray-900 block">
                              {item.productSnapshot.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              Qty: {item.quantity} × {formatPrice(item.productSnapshot.pricePaise)}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800">
                          {formatPrice(item.lineTotalPaise)}
                        </span>
                      </div>
                    ))}

                    {so.trackingNumber && (
                      <div className="mt-3 p-2 bg-blue-50 text-blue-800 rounded text-xs flex items-center">
                        <Truck className="w-3.5 h-3.5 mr-1.5" />
                        <span>Carrier Tracking: <strong>{so.trackingNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown & Actions */}
                  <div className="border-t md:border-t-0 md:border-l md:pl-6 border-gray-100 flex flex-col justify-between">
                    <div className="space-y-2 text-xs mb-4">
                      <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Financial Settlement
                      </h3>
                      <div className="flex justify-between text-gray-600">
                        <span>Gross Subtotal</span>
                        <span className="font-semibold text-gray-800">{formatPrice(so.vendorSubtotalPaise)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Platform Commission (10%)</span>
                        <span className="font-semibold text-red-600">
                          - {formatPrice(so.commissionPaise)}
                        </span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-sm text-gray-900">
                        <span>Net Seller Payout</span>
                        <span className="text-green-700">{formatPrice(so.vendorNetPaise)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Settlement via Razorpay Route linked account
                      </p>
                    </div>

                    {/* State Transition Actions */}
                    <div className="pt-2">
                      {so.fulfillmentStatus === 'PLACED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full flex items-center justify-center space-x-1"
                          onClick={() => handleStatusTransition(so._id, 'PACKED')}
                          isLoading={isUpdating}
                        >
                          <Package className="w-3.5 h-3.5 mr-1" />
                          <span>Mark as Packed</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}

                      {so.fulfillmentStatus === 'PACKED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full flex items-center justify-center space-x-1"
                          onClick={() => setShippingModalOrder(so)}
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          <span>Dispatch & Ship Package</span>
                        </Button>
                      )}

                      {so.fulfillmentStatus === 'SHIPPED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full flex items-center justify-center space-x-1 border border-green-600 text-green-700 hover:bg-green-50"
                          onClick={() => handleStatusTransition(so._id, 'DELIVERED')}
                          isLoading={isUpdating}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Confirm Delivered</span>
                        </Button>
                      )}

                      {so.fulfillmentStatus === 'DELIVERED' && (
                        <span className="block text-center text-xs font-bold text-green-700 bg-green-50 py-2 rounded-lg border border-green-200">
                          ✓ Completed & Delivered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Shipping Tracking Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Shipment for Order #{shippingModalOrder.orderId?.orderNumber}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter courier tracking details for the customer to monitor their delivery.
            </p>

            <form onSubmit={handleShipSubmit} className="space-y-4">
              <Input
                label="Tracking Number / AWB *"
                placeholder="e.g. BLUEDART-89472891"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
              />

              <Input
                label="Tracking URL (Optional)"
                placeholder="https://track.bluedart.com/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShippingModalOrder(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdating}>
                  Confirm Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

