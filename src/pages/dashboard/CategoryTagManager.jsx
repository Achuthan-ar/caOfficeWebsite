import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Grid,
  Tag as TagIcon,
} from 'lucide-react';

const CategoryTagManager = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [tagName, setTagName] = useState('');
  
  const [catSaving, setCatSaving] = useState(false);
  const [tagSaving, setTagSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/categories'),
        api.get('/tags'),
      ]);
      if (catRes.data?.success) setCategories(catRes.data.data);
      if (tagRes.data?.success) setTags(tagRes.data.data);
    } catch (err) {
      console.error('Error fetching taxonomies:', err.message);
      setErrorMsg('Error loading categories and tags listing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setCatSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/categories', { name: categoryName, description: categoryDesc });
      if (res.data?.success) {
        setSuccessMsg(`Category '${categoryName}' added successfully.`);
        setCategories([...categories, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setCategoryName('');
        setCategoryDesc('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    setTagSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/tags', { name: tagName });
      if (res.data?.success) {
        setSuccessMsg(`Tag '${tagName}' added successfully.`);
        setTags([...tags, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setTagName('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setTagSaving(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category '${name}'?`)) return;

    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data?.success) {
        setSuccessMsg(`Category '${name}' deleted successfully.`);
        setCategories(categories.filter((c) => c._id !== id));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTag = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tag '${name}'?`)) return;

    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/tags/${id}`);
      if (res.data?.success) {
        setSuccessMsg(`Tag '${name}' deleted successfully.`);
        setTags(tags.filter((t) => t._id !== id));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete tag');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const isAdmin = user?.role?.name === 'Admin';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/blog-admin"
          className="rounded-lg p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            Taxonomy Category & Tag Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add category structures and tags for article classification. Deletions are restricted to System Administrators.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {successMsg}
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Categories Manager Panel */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-heading">
            <Grid className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm">Blog Categories</h3>
          </div>
          <hr className="border-slate-105 dark:border-slate-900" />

          {/* Add Form */}
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Category Name *
              </label>
              <input
                required
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Auditing Schemes"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                placeholder="Brief summary..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={catSaving}
              className="inline-flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {catSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Category
            </button>
          </form>

          {/* Categories list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400">
                  <th className="py-2 font-bold uppercase">Name</th>
                  <th className="py-2 font-bold uppercase">Slug</th>
                  <th className="py-2 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-600 dark:text-slate-350">
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td className="py-3 font-bold">
                      {cat.name}
                      <span className="block text-[10px] font-medium text-slate-400 font-sans mt-0.5">{cat.description}</span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-slate-400">{cat.slug}</td>
                    <td className="py-3 text-right">
                      {isAdmin ? (
                        <button
                          disabled={actionLoading === cat._id}
                          onClick={() => handleDeleteCategory(cat._id, cat.name)}
                          className="text-rose-500 hover:bg-rose-500/10 border border-transparent p-1.5 rounded-md hover:border-rose-500/20"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tags Manager Panel */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-heading">
            <TagIcon className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm">Bulletins Tags</h3>
          </div>
          <hr className="border-slate-105 dark:border-slate-900" />

          {/* Add Form */}
          <form onSubmit={handleAddTag} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tag Name *
              </label>
              <input
                required
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g., Audit"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={tagSaving}
              className="inline-flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {tagSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Tag
            </button>
          </form>

          {/* Tags List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400">
                  <th className="py-2 font-bold uppercase">Name</th>
                  <th className="py-2 font-bold uppercase">Slug</th>
                  <th className="py-2 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {tags.map((tag) => (
                  <tr key={tag._id}>
                    <td className="py-3 font-bold">{tag.name}</td>
                    <td className="py-3 font-mono text-[10px] text-slate-400">{tag.slug}</td>
                    <td className="py-3 text-right">
                      {isAdmin ? (
                        <button
                          disabled={actionLoading === tag._id}
                          onClick={() => handleDeleteTag(tag._id, tag.name)}
                          className="text-rose-500 hover:bg-rose-500/10 border border-transparent p-1.5 rounded-md hover:border-rose-500/20"
                          title="Delete Tag"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CategoryTagManager;
