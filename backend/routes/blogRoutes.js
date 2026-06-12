import express from 'express';
import {
  getPublicBlogs,
  getFeaturedBlog,
  getRecentBlogs,
  getPublicBlogBySlug,
  getRelatedBlogs,
  getBlogComments,
  createBlogComment,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  archiveBlog,
  restoreBlog,
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateSchema, blogSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
router.get('/', getPublicBlogs);
router.get('/featured', getFeaturedBlog);
router.get('/recent', getRecentBlogs);
router.get('/post/:slug', getPublicBlogBySlug);
router.get('/post/:slug/related', getRelatedBlogs);
router.get('/post/:slug/comments', getBlogComments);
router.post('/post/:slug/comments', protect, createBlogComment); // Any logged-in user can comment

// ============================================================================
// SECURE ADMIN/MANAGER/TL DASHBOARD ROUTES
// ============================================================================
router.get('/admin', protect, authorize('Admin', 'CA Login', 'Manager'), getAllBlogsAdmin);
router.post('/admin', protect, authorize('Admin', 'CA Login', 'Manager'), validateSchema(blogSchema), createBlog);
router.put('/admin/:id', protect, authorize('Admin', 'CA Login', 'Manager'), updateBlog);
router.delete('/admin/:id', protect, authorize('Admin', 'CA Login', 'Manager'), deleteBlog);
router.put('/admin/:id/archive', protect, authorize('Admin', 'CA Login', 'Manager'), archiveBlog);
router.put('/admin/:id/restore', protect, authorize('Admin', 'CA Login', 'Manager'), restoreBlog);

export default router;
