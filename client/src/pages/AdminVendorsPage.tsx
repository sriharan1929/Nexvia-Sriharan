import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Check, X, Shield, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionModalVendor, setRejectionModalVendor] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/vendors${query}`);
      setVendors(res.data.data || []);
    } catch (error: any) {
      toast.error('Failed to load vendor applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const handleApprove = async (vendorId: string) => {
    if (!confirm('Approve this seller to start listing products on BadaVyapar?')) return;
    try {
      await api.patch(`/admin/vendors/${vendorId}/status`, {
        status: 'APPROVED',
      });
      toast.success('Seller approved successfully!');
      fetchVendors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve seller');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalVendor) return;

    setIsProcessing(true);
    try {
      await api.patch(`/admin/vendors/${rejectionModalVendor._id}/status`, {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Store profile does not meet standards',
      });
      toast.success('Seller application marked rejected');
      setRejectionModalVendor(null);
      setRejectionReason('');
      fetchVendors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject seller');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-black text-gray-900">
                Marketplace Administration
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Review seller onboarding requests, approve authentic merchants, and moderate marketplace access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/analytics">
              <Button variant="secondary" size="sm">
                <TrendingUp className="w-4 h-4 mr-1.5" /> Analytics & Coupons
              </Button>
            </Link>

            {/* Filter Tabs */}
            <div className="flex rounded-lg border border-gray-200 bg-white p-1 text-xs font-semibold">
            {['PENDING', 'APPROVED', 'REJECTED', ''].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab || 'ALL'}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-gray-500 text-sm">
                No vendor applications found for filter: {statusFilter || 'ALL'}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Store Name</th>
                    <th className="py-3 px-6">Applicant</th>
                    <th className="py-3 px-6">Contact Info</th>
                    <th className="py-3 px-6">Applied Date</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((v) => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-900 block">
                          {v.storeName}
                        </span>
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {v.description || 'No description provided'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {v.userId?.name || 'Unknown User'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-600 space-y-0.5">
                        <p>{v.contactEmail}</p>
                        <p className="text-gray-400">{v.contactPhone}</p>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">
                        {formatDate(v.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        {v.approvalStatus === 'APPROVED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                        {v.approvalStatus === 'PENDING' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        )}
                        {v.approvalStatus === 'REJECTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {v.approvalStatus === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(v._id)}
                              className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectionModalVendor(v)}
                              className="inline-flex items-center px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-semibold transition"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Rejection Modal */}
      {rejectionModalVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Reject Application for {rejectionModalVendor.storeName}
            </h2>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  placeholder="e.g. Incomplete business verification documents or duplicate store."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectionModalVendor(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  isLoading={isProcessing}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

