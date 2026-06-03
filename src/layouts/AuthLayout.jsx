import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Force light mode on mount for the authentication pages
  useEffect(() => {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Redirect to dashboard if session is already active
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-hidden px-4 py-12">
      {/* Blur spheres */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[130px] animate-pulse-glow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[130px] animate-pulse-glow" style={{ animationDelay: '3s' }}></div>

      {/* Floating particles */}
      <div className="absolute top-[10%] right-[15%] w-20 h-20 rounded-full bg-indigo-500/5 blur-lg animate-float"></div>
      <div className="absolute bottom-[15%] left-[10%] w-28 h-28 rounded-full bg-purple-500/5 blur-lg animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Auth Card Container - Light Glassmorphism with primary glow */}
      <div className="w-full max-w-md bg-white border border-slate-200 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10 relative glow-primary transition-all duration-300">
        <div className="flex flex-col items-center mb-6">
          <img src="/favicon.png" alt="D.K. NAGARAJAN Logo" className="h-16 w-16 rounded-full object-cover border border-slate-200 shadow-md mb-3" />
          <h2 className="text-2xl font-black text-slate-850 tracking-tight font-heading uppercase text-center">D.K. NAGARAJAN</h2>
          <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase mt-0.5 text-center">Chartered Accountant</p>
          <p className="text-slate-450 text-[10px] mt-1.5 text-center">Secure Client Management Portal</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
