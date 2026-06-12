import express from 'express';
import {
  getComplianceDates,
  createComplianceDeadline,
} from '../controllers/complianceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getComplianceDates);
router.post('/', protect, authorize('Admin', 'CA Login'), createComplianceDeadline);

export default router;
