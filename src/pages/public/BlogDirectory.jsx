import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, RotateCw, ArrowRight, Eye, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

const BlogDirectory = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredBlog, setFeaturedBlog] = useState(null);
  
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err.message);
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await api.get('/blogs/featured');
      if (res.data?.success) {
        setFeaturedBlog(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching featured blog:', err.message);
    }
  }, []);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 6,
      };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/blogs', { params });
      if (res.data?.success) {
        setBlogs(res.data.data);
        setTotalPages(res.data.totalPages);
      } else {
        setError('Failed to retrieve blogs');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err.message);
      setError('Connection to compliance services interrupted.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, search]);

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, [fetchCategories, fetchFeatured]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* Headings */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Compliance & Tax Insights
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Stay updated with statutory notifications, financial guidelines, audits, and business planning advices from our audit firm.
        </p>
      </div>

      {/* Featured Blog Layout */}
      {featuredBlog && !selectedCategory && !search && (
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-2">
          {/* Text panel */}
          <div className="p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                  Featured Article
                </span>
                <span className="text-slate-400 font-semibold">•</span>
                <span className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-lg text-slate-500">
                  {featuredBlog.category?.name}
                </span>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-850 dark:text-white leading-snug hover:text-indigo-500">
                <Link to={`/blog/${featuredBlog.slug}`}>{featuredBlog.title}</Link>
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-4">
                {featuredBlog.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-905 pt-4">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><User className="h-4 w-4" />{featuredBlog.author?.name}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(featuredBlog.publishedAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{featuredBlog.views} views</span>
              </div>
              <Link
                to={`/blog/${featuredBlog.slug}`}
                className="inline-flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Read Article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          {/* Banner Graphic placeholder */}
          <div className="bg-gradient-to-tr from-indigo-50 to-purple-50/50 min-h-60 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-850 p-8 text-center text-slate-600">
            <div className="space-y-2">
              <span className="block font-heading text-2xl font-bold bg-gradient-to-tr from-indigo-600 to-purple-600 bg-clip-text text-transparent">CA Compliance Briefings</span>
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Published by System Administrator</span>
            </div>
          </div>
        </section>
      )}

      {/* Categories Tabs & Search */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        
        {/* Categories Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
          <button
            onClick={() => handleCategorySelect('')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === ''
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900'
            }`}
          >
            All Categories
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 mt-3 md:mt-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search updates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
        </form>
      </section>

      {/* Blogs Grid Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-850 rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-xs text-slate-400">{error}</p>
          <button onClick={fetchBlogs} className="mt-3 inline-flex items-center gap-1 border rounded-lg px-3 py-1.5 text-xs text-indigo-500">
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          No articles match your search or category selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <article
              key={blog._id}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    {blog.category?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-805 dark:text-white font-heading hover:text-indigo-500 leading-tight">
                  <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/[0.2] dark:bg-slate-900/[0.1] flex items-center justify-between">
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

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <section className="flex items-center justify-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 cursor-pointer disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-lg p-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 cursor-pointer disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      )}
    </div>
  );
};

export default BlogDirectory;
