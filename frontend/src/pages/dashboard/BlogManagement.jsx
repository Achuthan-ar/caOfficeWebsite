import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
} from 'lucide-react';

const BlogManagement = () => {
  const { user } = useAuthStore();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBlogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/blogs/admin');
      if (response.data?.success) {
        setBlogs(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin blogs:', err.message);
      setError(err.response?.data?.message || 'Error loading blogs registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleArchive = async (blogId) => {
    setActionLoading(blogId);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/blogs/admin/${blogId}/archive`);
      if (response.data?.success) {
        setSuccess('Blog post archived successfully.');
        setBlogs(blogs.map((b) => (b._id === blogId ? { ...b, status: 'Archived' } : b)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive blog');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (blogId) => {
    setActionLoading(blogId);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/blogs/admin/${blogId}/restore`);
      if (response.data?.success) {
        setSuccess('Blog restored to Draft status.');
        setBlogs(blogs.map((b) => (b._id === blogId ? { ...b, status: 'Draft' } : b)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore blog');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to permanently delete this blog post?')) {
      return;
    }

    setActionLoading(blogId);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/blogs/admin/${blogId}`);
      if (response.data?.success) {
        setSuccess('Blog post deleted successfully.');
        setBlogs(blogs.filter((b) => b._id !== blogId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete blog');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    if (statusFilter === 'All') return true;
    return b.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const roleName = user?.role?.name;

  return (
    <div className="space-y-6">
      
      {/* Head */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Blog Bulletins Registry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create, review, publish, and archive compliance articles and tax updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/blog-taxonomy"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Taxonomy Manager
          </Link>
          <Link
            to="/blog-form"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-500/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {['All', 'Draft', 'Pending', 'Published', 'Archived'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === status
                ? 'bg-slate-800 text-white dark:bg-indigo-500'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Blogs Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No blog posts found matching that filter. Click "Create Post" to write one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase">Title</th>
                  <th className="py-3 px-4 font-bold uppercase">Author</th>
                  <th className="py-3 px-4 font-bold uppercase">Category</th>
                  <th className="py-3 px-4 font-bold uppercase">Views</th>
                  <th className="py-3 px-4 font-bold uppercase">Status</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {filteredBlogs.map((post) => {
                  const isOwner = post.author?._id === user?.id;
                  const canEdit = roleName === 'Admin' || roleName === 'Manager' || isOwner;
                  const isActioning = actionLoading === post._id;

                  return (
                    <tr key={post._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-slate-200 max-w-xs truncate">
                        {post.isFeatured && (
                          <span className="mr-1.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1 py-0.2 text-[8px] font-bold uppercase">
                            Featured
                          </span>
                        )}
                        {post.title}
                      </td>
                      <td className="py-3.5 px-4 font-medium">{post.author?.name}</td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className="rounded bg-indigo-500/15 text-indigo-500 px-1.5 py-0.5 font-bold uppercase text-[9px]">
                          {post.category?.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Eye className="h-4 w-4" />
                          <span>{post.views}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          post.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          post.status === 'Draft' ? 'bg-slate-100 text-slate-550 border border-slate-200/50 dark:bg-slate-900 dark:border-slate-800' :
                          post.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit ? (
                            <>
                              <Link
                                to={`/blog-form/${post._id}`}
                                className="rounded-lg p-2 text-indigo-500 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                                title="Edit Post"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>
                              
                              {post.status !== 'Archived' ? (
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleArchive(post._id)}
                                  className="rounded-lg p-2 text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20"
                                  title="Archive Post"
                                >
                                  {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                                </button>
                              ) : (
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleRestore(post._id)}
                                  className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                                  title="Restore Post"
                                >
                                  {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                </button>
                              )}

                              <button
                                disabled={isActioning}
                                onClick={() => handleDelete(post._id)}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                                title="Delete Post"
                              >
                                {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Read-Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
