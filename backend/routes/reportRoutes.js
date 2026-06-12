import express from 'express';
import {
  generateMonthlyReport,
  getMonthlyReports,
  getTeamPerformance,
  getReportAnalytics,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, authorize('Admin', 'CA Login'), generateMonthlyReport);
router.get('/', protect, getMonthlyReports);
router.get('/teams', protect, authorize('Admin', 'CA Login', 'Manager'), getTeamPerformance);
router.get('/analytics', protect, authorize('Admin', 'CA Login'), getReportAnalytics);

export default router;
