import express from 'express';
import {
  getAdminDashboard,
  getCALoginDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
  getInternDashboard,
  getClientDashboard,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only dashboard
router.get('/admin', protect, authorize('Admin'), getAdminDashboard);

// CA Login dashboard (handles both 'ca login' and 'ca-login')
router.get('/ca%20login', protect, authorize('Admin', 'CA Login'), getCALoginDashboard);
router.get('/ca login', protect, authorize('Admin', 'CA Login'), getCALoginDashboard);
router.get('/ca-login', protect, authorize('Admin', 'CA Login'), getCALoginDashboard);

// Manager dashboard (previously TL)
router.get('/manager', protect, authorize('Admin', 'CA Login', 'Manager'), getManagerDashboard);

// Employee dashboard
router.get('/employee', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), getEmployeeDashboard);

// Intern dashboard
router.get('/intern', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee', 'Intern'), getInternDashboard);

// Client dashboard
router.get('/client', protect, authorize('Admin', 'Client'), getClientDashboard);

export default router;
