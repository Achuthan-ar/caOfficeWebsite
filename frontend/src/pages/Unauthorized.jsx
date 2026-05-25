import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-red-500/10 dark:bg-red-500/5 p-4 border border-red-500/25 mb-6 text-red-500 animate-pulse">
        <ShieldAlert className="h-16 w-16" />
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
        Access Restricted
      </h2>
      
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md text-sm leading-relaxed">
        Your role does not possess the necessary permissions to access this page. If you believe this is an error, please contact your System Administrator.
      </p>

      <div className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-850 dark:hover:bg-slate-800 text-white border border-slate-200/10 dark:border-slate-800 px-5 py-2.5 text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
