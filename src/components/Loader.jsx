import React from 'react';

const Loader = ({ text = 'Loading...', fullscreen = true, overlay = false }) => {
  const containerClasses = overlay
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300'
    : fullscreen
    ? 'min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300'
    : 'w-full py-12 flex flex-col items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute w-28 h-28 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-xl animate-pulse"></div>

        {/* Outer spinner track */}
        <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-slate-800"></div>

        {/* Spinning active ring */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>

        {/* Centered Logo container */}
        <div className="absolute w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
          <img
            src="/favicon.png"
            alt="D.K. NAGARAJAN Logo"
            className="w-11 h-11 rounded-full object-cover"
          />
        </div>
      </div>

      {text && (
        <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium font-heading animate-pulse text-xs tracking-wider uppercase">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
