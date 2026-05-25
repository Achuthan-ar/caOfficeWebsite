import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, authorize('Admin', 'Manager'), getAllLeaves);
router.put('/:id/status', protect, authorize('Admin', 'Manager'), updateLeaveStatus);
router.put('/:id/cancel', protect, cancelLeave);

export default router;
