import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Briefcase, Menu, X, ArrowRight, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

const PublicLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Blog', path: '/blog' },
    { label: 'About Us', path: '/about' },
    { label: 'Careers', path: '/careers' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="D.K. NAGARAJAN Logo" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col text-left">
              <span className="font-heading text-sm font-black tracking-wide text-slate-850 dark:text-white uppercase leading-none">
                D.K. NAGARAJAN
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-1">
                Chartered Accountant
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-indigo-500 ${
                    isActive ? 'text-indigo-500 font-semibold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            


            {/* Portal Link */}
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Client Login'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Hamburger menu */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-slate-550 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 px-6 py-4 space-y-3.5 transition-colors duration-300">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-500"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-slate-100 dark:border-slate-900" />
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center flex items-center justify-center gap-1.5 bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Client Login'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>

      {/* Main Promo Website Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-12 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="D.K. NAGARAJAN Logo" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-850" />
              <div className="flex flex-col text-left">
                <span className="font-heading text-sm font-black tracking-wide text-slate-850 dark:text-white uppercase leading-none">
                  D.K. NAGARAJAN
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-1">
                  Chartered Accountant
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Professional accounting, auditing, taxation, and company compliance advisors. Helping startups and corporate giants grow securely.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>IRDAI & ICAI Registered</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-505 dark:text-slate-400">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-indigo-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a 
                  href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/sitemap.xml`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-indigo-500 transition-colors"
                >
                  XML Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Professional Services */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 font-heading">
              Our Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-505 dark:text-slate-400">
              <li>
                <Link to="/services" className="hover:text-indigo-500 transition-colors">GST Filings</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-indigo-500 transition-colors">Income Tax Returns</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-indigo-500 transition-colors">Statutory Audit Services</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-indigo-500 transition-colors">Company Incorporation</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-indigo-500 transition-colors">Accounting & Bookkeeping</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 font-heading">
              Office Details
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-505 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>102, Elite Business Hub, Tax Square, Mumbai, 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-400" />
                <span>+91 22 5555 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span>support@caoffice.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} D.K. NAGARAJAN & Co. All Rights Reserved. Pair programmed with Antigravity.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
