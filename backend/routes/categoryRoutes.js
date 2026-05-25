import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, authorize('Admin', 'Manager', 'TL'), createCategory);
router.delete('/:id', protect, authorize('Admin'), deleteCategory);

export default router;
