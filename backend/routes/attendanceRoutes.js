import express from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendanceStats,
  getMyAttendanceHistory,
  getTeamAttendanceToday,
  getAttendanceAnalytics,
  getMonthlyAttendanceReport,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Clock endpoints (all logged-in staff can access their own log)
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/stats', protect, getMyAttendanceStats);
router.get('/my-history', protect, getMyAttendanceHistory);

// Management endpoints (Admin and Manager only)
router.get('/team-today', protect, authorize('Admin', 'Manager'), getTeamAttendanceToday);
router.get('/analytics', protect, authorize('Admin', 'Manager'), getAttendanceAnalytics);
router.get('/report', protect, authorize('Admin', 'Manager'), getMonthlyAttendanceReport);

export default router;
