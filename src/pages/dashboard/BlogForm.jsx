import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
} from 'lucide-react';

const BlogForm = () => {
  "use no memo";
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [editorTab, setEditorTab] = useState('edit'); // 'edit' or 'preview'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: [],
      status: 'Draft',
      isFeatured: false,
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
    },
  });

  const contentValue = watch('content', '');

  const fetchTaxonomy = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/categories'),
        api.get('/tags'),
      ]);
      if (catRes.data?.success) setCategories(catRes.data.data);
      if (tagRes.data?.success) setTags(tagRes.data.data);
    } catch (err) {
      console.error('Error fetching taxonomies:', err.message);
    }
  }, []);

  const fetchBlogDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch post by id. But our public routes fetch by slug. Let's fetch from our admin lists or create a dedicated route.
      // Since our admin endpoint fetches all blogs, we can find the one matching the id
      const response = await api.get('/blogs/admin');
      if (response.data?.success) {
        const blogDoc = response.data.data.find((b) => b._id === id);
        if (blogDoc) {
          setIsEditing(true);
          reset({
            title: blogDoc.title,
            content: blogDoc.content,
            excerpt: blogDoc.excerpt || '',
            category: blogDoc.category?._id || '',
            tags: blogDoc.tags?.map((t) => t._id) || [],
            status: blogDoc.status,
            isFeatured: blogDoc.isFeatured || false,
            featuredImage: blogDoc.featuredImage || '',
            metaTitle: blogDoc.metaTitle || '',
            metaDescription: blogDoc.metaDescription || '',
            ogTitle: blogDoc.ogTitle || '',
            ogDescription: blogDoc.ogDescription || '',
          });
        } else {
          setErrorMsg('Post not found in system databases.');
        }
      }
    } catch (err) {
      console.error('Error loading blog details:', err.message);
      setErrorMsg('Error loading blog details.');
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchTaxonomy();
    if (id) {
      fetchBlogDetails();
    }
  }, [id, fetchTaxonomy, fetchBlogDetails]);

  const onSubmit = async (data) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let response;
      if (isEditing) {
        response = await api.put(`/blogs/admin/${id}`, data);
      } else {
        response = await api.post('/blogs/admin', data);
      }

      if (response.data?.success) {
        setSuccessMsg(response.data.message || 'Blog saved successfully.');
        setTimeout(() => {
          navigate('/blog-admin');
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving blog:', err.message);
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving blog');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const roleName = user?.role?.name;
  const isManager = roleName === 'Manager';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/blog-admin"
          className="rounded-lg p-2 border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <h2 className="text-xl font-bold text-slate-805 dark:text-white font-heading">
          {isEditing ? 'Modify Bulletin' : 'Draft Compliance Update'}
        </h2>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-450">
          <CheckCircle className="h-4.5 w-4.5" />
          {successMsg}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Bulletin Title *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., A Complete Guide to GST Filing for Businesses in 2026"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-450">{errors.title.message}</p>}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Excerpt (Brief Summary) *
            </label>
            <textarea
              rows="2"
              maxLength="300"
              {...register('excerpt', { required: 'Excerpt is required' })}
              placeholder="Summary shown on the blog feed directory (max 300 characters)..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.excerpt && <p className="mt-1 text-xs text-red-450">{errors.excerpt.message}</p>}
          </div>

          {/* Grid: Category & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category selection is required' })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-450">{errors.category.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Publication Status *
              </label>
              <select
                {...register('status')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                {/* Only Admin/CA Login can directly publish blogs */}
                {!isManager && <option value="Published">Published</option>}
                <option value="Archived">Archived</option>
              </select>
              {isManager && (
                <p className="mt-1.5 text-[10px] text-slate-400">
                  * Managers submit as "Pending Review" for CA Login publication.
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Bulletins Tags
            </label>
            <div className="flex flex-wrap gap-3.5 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850">
              {tags.map((tag) => (
                <label key={tag._id} className="flex items-center gap-2 text-xs text-slate-750 dark:text-slate-350 cursor-pointer">
                  <input
                    type="checkbox"
                    value={tag._id}
                    {...register('tags')}
                    className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4 border-slate-300 bg-transparent"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Featured Image Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Featured Image Link (Optional)
            </label>
            <input
              type="url"
              {...register('featuredImage')}
              placeholder="https://images.unsplash.com/photo-X"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Admin features */}
          {!isManager && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/50 bg-slate-50/30 dark:border-slate-850">
              <input
                type="checkbox"
                id="isFeatured"
                {...register('isFeatured')}
                className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4 border-slate-300 bg-transparent"
              />
              <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-750 dark:text-slate-350 cursor-pointer">
                Highlight as Featured Post (pins to top of public blog feed)
              </label>
            </div>
          )}

          {/* Rich content editor box (Edit / Preview tabs) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Bulletin Content *
              </label>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                    editorTab === 'edit'
                      ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                    editorTab === 'preview'
                      ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  HTML Preview
                </button>
              </div>
            </div>

            {editorTab === 'edit' ? (
              <div>
                <textarea
                  rows="12"
                  {...register('content', { required: 'Blog content is required' })}
                  placeholder="<h2>Subheading</h2><p>Write your tax or compliance bulletin details here...</p>"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.content && <p className="mt-1 text-xs text-red-450">{errors.content.message}</p>}
              </div>
            ) : (
              <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-xl p-4 min-h-64 overflow-y-auto text-xs sm:text-sm prose prose-slate dark:prose-invert max-w-none">
                {contentValue ? (
                  <div dangerouslySetInnerHTML={{ __html: contentValue }} />
                ) : (
                  <p className="text-xs text-slate-400 italic">No content to preview yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapsible SEO Panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowSeoPanel(!showSeoPanel)}
            className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 focus:outline-none border-b border-transparent dark:border-slate-850"
          >
            <span className="text-xs font-bold text-slate-750 dark:text-slate-350 uppercase tracking-wide">
              SEO Metatags Configuration
            </span>
            {showSeoPanel ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </button>
          
          {showSeoPanel && (
            <div className="p-6 space-y-4 border-t border-slate-100 dark:border-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Meta Title Tag
                </label>
                <input
                  type="text"
                  {...register('metaTitle')}
                  placeholder="Defaults to post title if blank"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Meta Description Tag
                </label>
                <textarea
                  rows="2"
                  {...register('metaDescription')}
                  placeholder="Defaults to excerpt if blank"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Open Graph Title
                  </label>
                  <input
                    type="text"
                    {...register('ogTitle')}
                    placeholder="OG Title tag"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Open Graph Description
                  </label>
                  <input
                    type="text"
                    {...register('ogDescription')}
                    placeholder="OG Description tag"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3.5">
          <Link
            to="/blog-admin"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 font-semibold px-5 py-2.5 text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl px-5 py-2.5 text-xs shadow-md shadow-indigo-500/10 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;
