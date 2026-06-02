import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuthStore } from './store/authStore';
import AppRoutes from './routes/AppRoutes';

function App() {
  const { checkAuth, logout, isLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const isSessionActive = sessionStorage.getItem('isSessionActive');
      if (!isSessionActive) {
        // Clear all persistent cookies and reset session when tab is reopened
        await logout();
      } else {
        await checkAuth();
      }
    };
    initAuth();
  }, [checkAuth, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium font-heading animate-pulse text-xs tracking-wider uppercase">
          Verifying credentials...
        </p>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
