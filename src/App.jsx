import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuthStore } from './store/authStore';
import AppRoutes from './routes/AppRoutes';
import Loader from './components/Loader';

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
    return <Loader text="Verifying credentials..." />;
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
