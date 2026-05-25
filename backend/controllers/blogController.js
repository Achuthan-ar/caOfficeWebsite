import Blog from '../models/Blog.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import BlogComment from '../models/BlogComment.js';
import AuditLog from '../models/AuditLog.js';

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

// @desc    Get all published blogs (with filter, search, pagination)
// @route   GET /api/blogs
// @access  Public
export const getPublicBlogs = async (req, res) => {
  const { search, category, tag, page = 1, limit = 6 } = req.query;

  const query = { status: 'Published' };

  // Search filter matching title and contents
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    // Filter by Category slug
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return res.json({ success: true, count: 0, totalPages: 0, currentPage: Number(page), data: [] });
      }
    }

    // Filter by Tag slug
    if (tag) {
      const tagDoc = await Tag.findOne({ slug: tag });
      if (tagDoc) {
        query.tags = tagDoc._id;
      } else {
        return res.json({ success: true, count: 0, totalPages: 0, currentPage: Number(page), data: [] });
      }
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limitNum);

    const blogs = await Blog.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      count: blogs.length,
      totalPages,
      currentPage: pageNum,
      totalCount: totalBlogs,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single published blog by slug
// @route   GET /api/blogs/post/:slug
// @access  Public
export const getPublicBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'Published' })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Increment view counter on lookup
    blog.views += 1;
    await blog.save();

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get related published blogs
// @route   GET /api/blogs/post/:slug/related
// @access  Public
export const getRelatedBlogs = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'Published' });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const related = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      status: 'Published',
    })
      .populate('category', 'name slug')
      .populate('author', 'name email')
      .limit(3)
      .sort({ publishedAt: -1 });

    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured blog post
// @route   GET /api/blogs/featured
// @access  Public
export const getFeaturedBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ isFeatured: true, status: 'Published' })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email')
      .sort({ publishedAt: -1 });

    if (!blog) {
      // Fallback: fetch the latest published post
      const latestBlog = await Blog.findOne({ status: 'Published' })
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'name email')
        .sort({ publishedAt: -1 });

      return res.json({ success: true, data: latestBlog });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get 3 recent blogs
// @route   GET /api/blogs/recent
// @access  Public
export const getRecentBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'Published' })
      .populate('category', 'name slug')
      .populate('author', 'name email')
      .limit(3)
      .sort({ publishedAt: -1 });

    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comments for a blog post
// @route   GET /api/blogs/post/:slug/comments
// @access  Public
export const getBlogComments = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const comments = await BlogComment.find({ blog: blog._id, isApproved: true })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a comment
// @route   POST /api/blogs/post/:slug/comments
// @access  Private (Authenticated users)
export const createBlogComment = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Please provide comment text' });
  }

  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const comment = await BlogComment.create({
      blog: blog._id,
      user: req.user._id,
      content,
    });

    const populatedComment = await BlogComment.findById(comment._id).populate('user', 'name email');

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// SECURE ADMIN/MANAGER/TL DASHBOARD ENDPOINTS
// ============================================================================

// @desc    Get all blogs for administrative grid (drafts, published, archived)
// @route   GET /api/blogs/admin
// @access  Private (Admin, Manager, TL)
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const filter = {};
    
    // Team Lead role can only review/edit their own blog posts
    if (req.user.role.name === 'TL') {
      filter.author = req.user._id;
    }

    const blogs = await Blog.find(filter)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a blog post
// @route   POST /api/blogs/admin
// @access  Private (Admin, Manager, TL)
export const createBlog = async (req, res) => {
  const {
    title, content, excerpt, category, tags, status, isFeatured, featuredImage,
    metaTitle, metaDescription, ogTitle, ogDescription, ogImage,
  } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
  }

  try {
    const blog = await Blog.create({
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      author: req.user._id,
      status: status || 'Draft',
      isFeatured: isFeatured || false,
      featuredImage: featuredImage || '',
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Blog Created',
      details: `Blog post "${title}" created as ${status || 'Draft'}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a blog post
// @route   PUT /api/blogs/admin/:id
// @access  Private (Admin, Manager, TL)
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Role checks: Team Leads (TL) can only update their own blog entries
    if (req.user.role.name === 'TL' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit other team members posts' });
    }

    const fieldsToUpdate = [
      'title', 'content', 'excerpt', 'category', 'tags', 'status', 
      'isFeatured', 'featuredImage', 'metaTitle', 'metaDescription', 
      'ogTitle', 'ogDescription', 'ogImage',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        blog[field] = req.body[field];
      }
    });

    await blog.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Blog Updated',
      details: `Blog post "${blog.title}" updated`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blogs/admin/:id
// @access  Private (Admin, Manager, TL)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Role checks: Team Leads can only delete their own posts
    if (req.user.role.name === 'TL' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete other team members posts' });
    }

    // Delete comments linked to the post
    await BlogComment.deleteMany({ blog: blog._id });

    await Blog.findByIdAndDelete(req.params.id);

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Blog Deleted',
      details: `Blog post "${blog.title}" deleted`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive a blog post
// @route   PUT /api/blogs/admin/:id/archive
// @access  Private (Admin, Manager, TL)
export const archiveBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    if (req.user.role.name === 'TL' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to archive other team members posts' });
    }

    blog.status = 'Archived';
    await blog.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Blog Archived',
      details: `Blog post "${blog.title}" archived`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Blog archived successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore an archived blog post
// @route   PUT /api/blogs/admin/:id/restore
// @access  Private (Admin, Manager, TL)
export const restoreBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    if (req.user.role.name === 'TL' && blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to restore other team members posts' });
    }

    blog.status = 'Draft';
    await blog.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Blog Restored',
      details: `Blog post "${blog.title}" restored to Draft status`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Blog post restored to Draft status', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
