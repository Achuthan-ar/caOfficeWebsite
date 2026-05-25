import express from 'express';
import { getTags, createTag, deleteTag } from '../controllers/tagController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getTags);
router.post('/', protect, authorize('Admin', 'Manager', 'TL'), createTag);
router.delete('/:id', protect, authorize('Admin'), deleteTag);

export default router;
