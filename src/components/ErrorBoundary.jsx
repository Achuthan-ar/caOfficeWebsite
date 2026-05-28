import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details to console
    console.error('ErrorBoundary captured exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI rendering
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 py-12 transition-colors duration-300">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-xl text-center glass glow-primary">
            <div className="mx-auto rounded-full bg-red-500/10 dark:bg-red-500/20 p-4 text-red-500 w-fit animate-pulse mb-6">
              <ShieldAlert className="h-10 w-10" />
            </div>
            
            <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mb-3">
              Application Error
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Something went wrong while rendering this component. Please try reloading the page or go back to your dashboard homepage.
            </p>

            {/* If in dev mode, render the details */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 text-left max-h-36 overflow-y-auto">
                <p className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-wider mb-1">
                  Error Details:
                </p>
                <p className="text-[10px] font-mono text-slate-655 dark:text-slate-350 select-text leading-tight break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 cursor-pointer transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-[0.98] text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
