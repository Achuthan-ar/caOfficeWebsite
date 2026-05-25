import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Building,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Bookmark,
} from 'lucide-react';

const Home = () => {
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/blogs/recent`);
        if (response.data?.success) {
          setRecentBlogs(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching recent blogs:', err.message);
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchBlogs();
  }, []);

  const stats = [
    { label: 'Years of Excellence', value: '15+', icon: Award },
    { label: 'Corporate Clients', value: '500+', icon: Users },
    { label: 'Audits Completed', value: '2,500+', icon: CheckCircle },
    { label: 'ICAI Certifications', value: '100%', icon: ShieldCheck },
  ];

  const highlights = [
    { title: 'Tax Strategy', desc: 'Customized planning to minimize direct/indirect liability lawfully.', icon: TrendingUp },
    { title: 'Audit Verification', desc: 'Thorough, ICAI-compliant statutory and internal ledger auditing.', icon: Building },
    { title: 'Corporate Bookkeeping', desc: 'Complete outsourcing of accounts ledgers, payroll, and cashflows.', icon: Clock },
  ];

  const testimonials = [
    { name: 'Rajesh Mehta', role: 'CEO, Mehta Technologies', text: 'Their automated GST compliance portal saves our accounting team 15+ hours monthly. The best auditors in Mumbai.' },
    { name: 'Sarah Thomas', role: 'Founder, Apex Logistics', text: 'CA Office guided us through company incorporation, tax planning, and statutory setup in under 7 days. Outstanding!' },
    { name: 'Amit Desai', role: 'CFO, Sterling Real Estate', text: 'Internal audit reports were completed with extreme detail, helping us secure a round of banking finance smoothly.' },
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 lg:py-32 px-6">
        {/* Glow Spheres */}
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[130px] animate-pulse-glow" style={{ animationDelay: '4s' }}></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-4.5 w-4.5" />
              Trusted Accounting & Tax Advisors
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.1] text-white">
              Securing Your Assets. <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Optimizing Your Wealth.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-350 max-w-xl leading-relaxed">
              We provide statutory audits, dynamic GST filing, direct tax strategies, and company incorporation. Streamlined compliances managed via our secure cloud portal.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/contact"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl px-6 py-3.5 text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Schedule Consult
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/services"
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl px-6 py-3.5 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                Explore Services
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Visual Frame */}
            <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 border border-slate-800 shadow-2xl overflow-hidden p-6 glass flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Office Statistics</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="grid grid-cols-2 gap-4 my-auto">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-2xl font-black text-white font-heading">500+</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Corporate Clients</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <p className="text-2xl font-black text-white font-heading">99.8%</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Filing Accuracy</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-3">
                <span>ICAI Member Firm Code: CA-50029X</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Counter */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center space-y-1">
                <div className="inline-flex p-2 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 rounded-lg mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-slate-800 dark:text-white font-heading">{stat.value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Our Key Competencies
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Experienced professionals managing complicated compliance files so you can focus on building your startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-500/30 transition-all duration-300">
                <div className="rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 p-3 w-fit mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold font-heading tracking-tight text-white">
              Why Partner With Us?
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We leverage cloud accounting software, direct API integration to compliance portals, and a seasoned team of qualified CAs to guarantee accurate, timely, and secure filings.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 p-1.5 rounded-lg shrink-0 h-fit">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Secure Portal Infrastructure</h4>
                  <p className="text-xs text-slate-400 mt-1">Review ledger audits and download GSTR filings 24/7 inside your client dashboard.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 p-1.5 rounded-lg shrink-0 h-fit">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zero Delayed Compliance Penalties</h4>
                  <p className="text-xs text-slate-400 mt-1">Automated reminders and prompt workflows ensure taxes are processed before deadlines.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
            <h3 className="text-lg font-bold font-heading text-white">Need Consultation?</h3>
            <p className="text-xs text-slate-400">Leave your details and a compliance auditor will contact you in under 2 hours.</p>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Consultation requested! Our team will contact you shortly.'); }}>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                required
                type="email"
                placeholder="Business Email"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full bg-indigo-500 text-white rounded-xl py-2 px-4 text-xs font-bold hover:bg-indigo-600 transition-colors"
              >
                Send Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Loved by Corporate CFOs & Founders
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hear from businesses that outsourced their tax audit requirements to our office.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-4 relative flex flex-col justify-between">
              <MessageSquare className="absolute top-4 right-4 h-5 w-5 text-slate-205 dark:text-slate-800" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                "{item.text}"
              </p>
              <div className="border-t border-slate-100 dark:border-slate-900 pt-3">
                <p className="text-xs font-bold text-slate-800 dark:text-white font-heading">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Blogs Preview Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
              Compliance Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Read current updates regarding tax slates, statutory compliance regulations, and financial management.
            </p>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-650"
          >
            All Articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingBlogs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
          </div>
        ) : recentBlogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
            No compliance blogs published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentBlogs.map((blog) => (
              <article key={blog._id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {blog.category?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(blog.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading hover:text-indigo-500 leading-tight">
                    <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>
                <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/[0.3] dark:bg-slate-900/[0.1] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">By {blog.author?.name}</span>
                  <Link
                    to={`/blog/${blog.slug}`}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-500 hover:underline"
                  >
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-10 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]"></div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight relative z-10">
            Secure Your Company’s Compliance Auditing Today
          </h2>
          <p className="text-xs text-indigo-100 max-w-lg mx-auto relative z-10 leading-relaxed">
            Get linked to our secure digital CA ecosystem. Avoid late GSTR penalties, optimize bookkeeping structures, and plan corporate direct tax files seamlessly.
          </p>
          <div className="flex justify-center gap-4 relative z-10 pt-2">
            <Link
              to="/contact"
              className="bg-white hover:bg-slate-50 text-indigo-650 font-bold rounded-xl px-6 py-3 text-xs shadow-md active:scale-[0.98] transition-all"
            >
              Contact Office
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold rounded-xl px-6 py-3 text-xs active:scale-[0.98] transition-all"
            >
              Client Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
