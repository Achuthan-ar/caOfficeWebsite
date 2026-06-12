import express from 'express';
import { getDepartments, createDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDepartments);
router.post('/', protect, authorize('Admin', 'CA Login'), createDepartment);
router.delete('/:id', protect, authorize('Admin'), deleteDepartment);

export default router;
