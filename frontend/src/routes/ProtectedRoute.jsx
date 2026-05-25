import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ allowedRoles = [], requiredPermission = null }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium font-heading animate-pulse">
          Securing session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin role automatically grants access to all routes
  if (user?.role?.name === 'Admin') {
    return <Outlet />;
  }

  // Perform role-based access checks
  if (allowedRoles.length > 0) {
    const roleName = user?.role?.name;
    if (!allowedRoles.includes(roleName)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Perform permission-based access checks
  if (requiredPermission) {
    const permissions = user?.role?.permissions || [];
    const hasPermission = permissions.some((p) => p.name === requiredPermission);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
