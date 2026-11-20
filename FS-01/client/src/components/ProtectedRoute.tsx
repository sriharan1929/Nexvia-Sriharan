import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user?.roles?.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 text-sm mb-6">
              You do not have the required permissions to view this dashboard or resource.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition"
            >
              Return to Marketplace
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
