import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import type { Order } from '../types';
import { Package, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/orders');
        setOrders(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Your Purchases
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Track packages, view shipment states from multiple sellers, and download invoices.
        </p>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">No orders yet</h2>
            <p className="text-sm text-gray-500 mb-6">You have not placed any orders on Market Zone yet.</p>
            <Link to="/products">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-amber-200 transition"
              >

                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-gray-500 block">ORDER PLACED</span>
                      <span className="font-semibold text-gray-800">{formatDate(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">TOTAL AMOUNT</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {formatPrice(order.totalPaise)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">SHIP TO</span>
                      <span className="font-semibold text-gray-800">{order.addressSnapshot.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500 font-mono">#{order.orderNumber}</span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center text-amber-600 font-bold hover:text-amber-700"
                    >
                      <span>Order Details</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Link>
                  </div>
                </div>

                {/* Sub-orders / Shipments summary */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {order.paymentStatus === 'PAID' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Payment Confirmed
                        </span>
                      )}
                      {order.paymentStatus === 'PENDING' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Payment Processing
                        </span>
                      )}
                      {order.paymentStatus === 'FAILED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Payment Failed
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {order.sellerOrders?.length || 0}{' '}
                      {order.sellerOrders?.length === 1 ? 'Seller Package' : 'Independent Packages'}
                    </span>
                  </div>

                  {/* Render Seller Order Shipments */}
                  <div className="space-y-3">
                    {order.sellerOrders?.map((so: any) => (
                      <div
                        key={so._id}
                        className="bg-gray-50/70 rounded-lg p-3 border border-gray-100 flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="text-xs font-bold text-amber-800 block">
                            Store: {so.vendorId?.storeName || 'Verified Merchant'}
                          </span>
                          <span className="text-gray-700 text-xs">
                            {so.items?.map((i: any) => `${i.quantity}× ${i.productSnapshot.title}`).join(', ')}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                          Status: {so.fulfillmentStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
