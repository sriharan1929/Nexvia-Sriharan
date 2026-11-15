import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  CreditCard,
  Download,
} from 'lucide-react';

const FULFILLMENT_STEPS = ['PLACED', 'PACKED', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (error) {
      console.error('Failed to load order detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const handleSimulatePayment = async () => {
    if (!order) return;
    try {
      setIsPaying(true);
      await api.post('/payments/simulate', { orderId: order._id });
      toast.success('Payment captured successfully!');
      await fetchOrderDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setIsDownloading(true);
      const res = await api.get(`/orders/${order._id}/invoice.pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch (err: any) {
      toast.error('Failed to download invoice PDF');
    } finally {
      setIsDownloading(false);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <Link to="/orders">
            <Button variant="primary">Return to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-amber-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Placed on {formatDate(order.createdAt)} · {order.sellerOrders?.length || 0} Independent Seller Shipments
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {order.paymentStatus === 'PAID' && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Paid
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={isDownloading}
                    onClick={handleDownloadInvoice}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Invoice (PDF)
                  </Button>
                </div>
              )}
              {order.paymentStatus === 'PENDING' && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Clock className="w-4 h-4 mr-1" /> Payment Pending
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isPaying}
                    onClick={handleSimulatePayment}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address & Order Snapshot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Delivery Address Snapshot
            </h3>
            <p className="font-bold text-gray-900 text-sm">{order.addressSnapshot.name}</p>
            <p className="text-gray-600 text-sm mt-0.5">{order.addressSnapshot.line1}</p>
            {order.addressSnapshot.line2 && (
              <p className="text-gray-600 text-sm">{order.addressSnapshot.line2}</p>
            )}
            <p className="text-gray-600 text-sm">
              {order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.pincode}
            </p>
            <p className="text-gray-500 text-xs mt-1">Phone: {order.addressSnapshot.phone}</p>
          </div>

          <div className="border-t md:border-t-0 md:border-l md:pl-6 border-gray-100 space-y-2 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Payment Summary
            </h3>
            <div className="flex justify-between text-gray-600">
              <span>Item Subtotal</span>
              <span className="font-medium text-gray-800">{formatPrice(order.itemSubtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base text-gray-900">
              <span>Total Paid</span>
              <span>{formatPrice(order.totalPaise)}</span>
            </div>
          </div>
        </div>

        {/* Independent Seller Packages */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Fulfillment Tracking by Seller
          </h2>

          {order.sellerOrders?.map((so: any, index: number) => {
            const currentStepIndex = FULFILLMENT_STEPS.indexOf(so.fulfillmentStatus);

            return (
              <div
                key={so._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Package Header */}
                <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-sm text-amber-950">
                      Package {index + 1}: {so.vendorId?.storeName || 'Verified Merchant'}
                    </span>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-white text-gray-800 border border-gray-200">
                    Status: {so.fulfillmentStatus}
                  </span>
                </div>

                {/* Stepper Progress Bar */}
                <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center justify-between max-w-xl mx-auto relative">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1 bg-gray-200 -z-0" />
                    {FULFILLMENT_STEPS.map((step, sIdx) => {
                      const isComplete = sIdx <= currentStepIndex;
                      const isCurrent = sIdx === currentStepIndex;

                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                              isComplete
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-amber-100' : ''}`}
                          >
                            {isComplete ? '✓' : sIdx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-semibold mt-1.5 ${
                              isComplete ? 'text-amber-800' : 'text-gray-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {so.trackingNumber && (
                    <div className="mt-4 text-center text-xs text-gray-600 flex items-center justify-center space-x-2">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                      <span>Tracking: <strong>{so.trackingNumber}</strong></span>
                      {so.trackingUrl && (
                        <a
                          href={so.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-600 hover:text-amber-700 inline-flex items-center underline ml-1"
                        >
                          Track Shipment <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Immutable Historical Items Snapshot */}
                <div className="p-6 divide-y divide-gray-100">
                  {so.items?.map((item: any, iIdx: number) => (
                    <div
                      key={iIdx}
                      className="py-3 flex items-center justify-between text-sm first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-3">
                        {item.productSnapshot.image ? (
                          <img
                            src={item.productSnapshot.image}
                            alt={item.productSnapshot.title}
                            className="w-12 h-12 object-cover rounded-md border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                            No pic
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.productSnapshot.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Snapshot Price: {formatPrice(item.productSnapshot.pricePaise)} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-gray-900">
                        {formatPrice(item.lineTotalPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
