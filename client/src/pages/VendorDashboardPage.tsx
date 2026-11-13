import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import type { VendorProfile, Product, Category } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceInRupees, setPriceInRupees] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendorData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/vendor/profile');
      setVendor(res.data.data.vendorProfile);

      if (res.data.data.vendorProfile.approvalStatus === 'APPROVED') {
        const [prodRes, catRes] = await Promise.all([
          api.get('/vendor/products'),
          api.get('/categories'),
        ]);
        setProducts(prodRes.data.data || []);
        setCategories(catRes.data.data || []);
        if (catRes.data.data?.length > 0) {
          setCategoryId(catRes.data.data[0]._id);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setVendor(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPriceInRupees('');
    setStock('10');
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
    setShowProductModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setDescription(prod.description);
    setPriceInRupees((prod.pricePaise / 100).toString());
    setStock(prod.stock.toString());
    setCategoryId(prod.categoryId || (prod.category?._id ?? ''));
    setImageUrl(prod.images?.[0]?.url || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceInRupees || !stock || !categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const pricePaise = Math.round(parseFloat(priceInRupees) * 100);
    const stockInt = parseInt(stock, 10);

    const payload = {
      title,
      description: description || 'High quality marketplace item.',
      pricePaise,
      stock: stockInt,
      categoryId,
      images: imageUrl
        ? [{ key: `prod-${Date.now()}`, url: imageUrl, order: 0 }]
        : [],
    };

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await api.patch(`/vendor/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/vendor/products', payload);
        toast.success('Product created successfully');
      }
      setShowProductModal(false);
      fetchVendorData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      toast.success('Product archived');
      fetchVendorData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-gray-900">
                {vendor?.storeName || 'Seller Portal'}
              </h1>
              {vendor?.approvalStatus === 'APPROVED' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved Seller
                </span>
              )}
              {vendor?.approvalStatus === 'PENDING' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Pending Approval
                </span>
              )}
              {vendor?.approvalStatus === 'REJECTED' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Application Rejected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage your storefront catalog, stock levels, and order fulfillment.
            </p>
          </div>

          {vendor?.approvalStatus === 'APPROVED' && (
            <Button onClick={openCreateModal} variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> Add New Product
            </Button>
          )}
        </div>

        {/* Status Callout if not approved */}
        {vendor?.approvalStatus === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-amber-800">
            <h3 className="font-bold text-base flex items-center">
              <Clock className="w-5 h-5 mr-2" /> Application Under Review
            </h3>
            <p className="text-sm mt-1 text-amber-700">
              Your seller application for <strong>{vendor.storeName}</strong> has been received and is currently being verified by the marketplace team. You will be able to publish products as soon as your account is approved.
            </p>
          </div>
        )}

        {vendor?.approvalStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-red-800">
            <h3 className="font-bold text-base flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" /> Application Rejected
            </h3>
            <p className="text-sm mt-1 text-red-700">
              Reason: {vendor.rejectionReason || 'Does not meet current onboarding criteria.'}
            </p>
          </div>
        )}

        {/* Approved Products Table */}
        {vendor?.approvalStatus === 'APPROVED' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Your Store Listings ({products.length})</h2>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-gray-500 text-sm mb-4">No products listed yet.</p>
                <Button onClick={openCreateModal} variant="primary" size="sm">
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-6">Product</th>
                      <th className="py-3 px-6">Price</th>
                      <th className="py-3 px-6">Stock</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 flex items-center space-x-3">
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt={p.title}
                              className="w-10 h-10 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                              No pic
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {p.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              Slug: {p.slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          {formatPrice(p.pricePaise)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              p.stock > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                            title="Archive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <Input
                label="Product Title *"
                placeholder="e.g. Ergonomic Bluetooth Mouse"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price in ₹ (INR) *"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="999.00"
                  value={priceInRupees}
                  onChange={(e) => setPriceInRupees(e.target.value)}
                  required
                />
                <Input
                  label="Stock Inventory *"
                  type="number"
                  min="0"
                  placeholder="25"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Image URL (Unsplash or S3 CDN)"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <div className="pt-4 border-t flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {editingProduct ? 'Save Changes' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

