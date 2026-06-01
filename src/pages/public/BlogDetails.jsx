import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  Lock,
  Bookmark,
} from 'lucide-react';

const BlogDetails = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Blog post details
      const blogRes = await api.get(`/blogs/post/${slug}`);
      if (blogRes.data?.success) {
        const blogDoc = blogRes.data.data;
        setBlog(blogDoc);

        // 2. Fetch comments and related blogs concurrently
        const [commentsRes, relatedRes] = await Promise.all([
          api.get(`/blogs/post/${slug}/comments`),
          api.get(`/blogs/post/${slug}/related`),
        ]);

        if (commentsRes.data?.success) setComments(commentsRes.data.data);
        if (relatedRes.data?.success) setRelated(relatedRes.data.data);
      } else {
        setError('Blog post not found');
      }
    } catch (err) {
      console.error('Error fetching blog details:', err.message);
      setError(err.response?.data?.message || 'Error connecting to compliance feed');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const response = await api.post(`/blogs/post/${slug}/comments`, {
        content: commentText,
      });

      if (response.data?.success) {
        setComments([response.data.data, ...comments]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment error:', err.message);
      alert(err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="text-center py-16 px-4">
        <h3 className="text-xl font-bold text-slate-850 dark:text-white font-heading">
          Article Not Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {error || 'This article might have been archived or removed by compliance partners.'}
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* React Helmet for Dynamic SEO injection */}
      <Helmet>
        <title>{blog.metaTitle || `${blog.title} | CA Office Blog`}</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt} />
        <meta property="og:title" content={blog.ogTitle || blog.title} />
        <meta property="og:description" content={blog.ogDescription || blog.excerpt} />
        {blog.ogImage && <meta property="og:image" content={blog.ogImage} />}
      </Helmet>

      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Blog Post Content */}
        <article className="lg:col-span-2 space-y-6">
          
          {/* Post Header */}
          <div className="space-y-4">
            <span className="inline-block rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {blog.category?.name}
            </span>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-850 dark:text-white font-heading leading-tight tracking-tight">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-b border-slate-100 dark:border-slate-900 pb-4">
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{blog.author?.name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(blog.publishedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{blog.views} views</span>
            </div>
          </div>

          {/* HTML Rich content body */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <hr className="border-slate-200 dark:border-slate-800 my-8" />

          {/* Comments Section */}
          <section className="space-y-6">
            <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              Article Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea
                  rows="3"
                  required
                  placeholder="Share your thoughts on this tax/compliance update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {commentSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit Comment
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/[0.4] dark:bg-slate-900/[0.1] p-5 text-center space-y-3">
                <Lock className="h-6 w-6 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Login Required</h4>
                <p className="text-[11px] text-slate-550 dark:text-slate-400">Log in to your CA account to post replies on our bulletins.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-[11px] font-bold"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-850 p-4 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{comment.user?.name}</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-350">{comment.content}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        {/* Sidebar: Related Posts */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-805 dark:text-white font-heading flex items-center gap-2">
              <Bookmark className="h-4.5 w-4.5 text-indigo-400" />
              Related Bulletins
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />

            {related.length === 0 ? (
              <p className="text-[11px] text-slate-450 italic">No other bulletins in this category.</p>
            ) : (
              <div className="space-y-4">
                {related.map((post) => (
                  <div key={post._id} className="text-xs space-y-1">
                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 px-1 py-0.2 rounded border border-indigo-500/10 uppercase">
                      {post.category?.name}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-300 hover:text-indigo-500 leading-tight pt-1">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{new Date(post.publishedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogDetails;
