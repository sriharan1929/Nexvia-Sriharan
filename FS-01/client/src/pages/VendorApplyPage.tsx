import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const applySchema = z.object({
  storeName: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Please provide a short description of your store (min 10 chars)'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z
    .string()
    .min(10, 'Contact phone must have at least 10 digits')
    .max(15, 'Phone number too long'),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ApplyFormData = z.infer<typeof applySchema>;

export default function VendorApplyPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
  });

  const onSubmit = async (data: ApplyFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/vendor/applications', data);
      toast.success('Application submitted! It will be reviewed by admin.');
      navigate('/vendor');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to submit application';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded">
              Seller Onboarding
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-2">
              Apply to Sell on Market Zone
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Join hundreds of independent Indian sellers and reach customers nationwide.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="storeName"
              label="Store / Business Name *"
              placeholder="e.g. Royal Electronics"
              error={errors.storeName?.message}
              {...register('storeName')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Description *
              </label>
              <textarea
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                placeholder="What types of products do you sell? Describe your catalog and specialty."
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="contactEmail"
                type="email"
                label="Business Email *"
                placeholder="business@example.com"
                error={errors.contactEmail?.message}
                {...register('contactEmail')}
              />

              <Input
                id="contactPhone"
                label="Contact Phone *"
                placeholder="9876543210"
                error={errors.contactPhone?.message}
                {...register('contactPhone')}
              />
            </div>

            <Input
              id="logo"
              label="Store Logo / Banner URL (Optional)"
              placeholder="https://example.com/logo.png"
              error={errors.logo?.message}
              {...register('logo')}
            />

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Submit Seller Application
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
