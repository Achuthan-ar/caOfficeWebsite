import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect to dashboard if session is already active
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden px-4 py-12">
      {/* Blur spheres */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse-glow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[130px] animate-pulse-glow" style={{ animationDelay: '3s' }}></div>

      {/* Floating particles */}
      <div className="absolute top-[10%] right-[15%] w-20 h-20 rounded-full bg-indigo-500/5 blur-lg animate-float"></div>
      <div className="absolute bottom-[15%] left-[10%] w-28 h-28 rounded-full bg-purple-500/5 blur-lg animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl p-8 z-10 border border-slate-800/40 relative">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">CA Office ERP</h2>
          <p className="text-slate-400 text-xs mt-1">Secure Client Management Portal</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
