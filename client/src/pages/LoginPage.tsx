import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const success = await login(data.email, data.password);
    setIsSubmitting(false);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center text-3xl font-black text-gray-900 tracking-tight">
          Bada<span className="text-amber-600">Vyapar</span>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-amber-600 hover:text-amber-500 underline"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              id="email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full shadow-sm"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Demo Credentials:</p>
            <p>Admin: <code className="bg-gray-100 px-1 py-0.5 rounded">admin@badavyapar.com</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">Admin@123</code></p>
            <p className="mt-1">Vendor: <code className="bg-gray-100 px-1 py-0.5 rounded">vendor1@example.com</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">Vendor@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
