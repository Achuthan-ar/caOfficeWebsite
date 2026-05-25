import express from 'express';
import {
  getAdminDashboard,
  getManagerDashboard,
  getTLDashboard,
  getEmployeeDashboard,
  getInternDashboard,
  getClientDashboard,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only dashboard
router.get('/admin', protect, authorize('Admin'), getAdminDashboard);

// Manager dashboard (Admin, Manager)
router.get('/manager', protect, authorize('Admin', 'Manager'), getManagerDashboard);

// Team Lead dashboard (Admin, Manager, TL)
router.get('/tl', protect, authorize('Admin', 'Manager', 'TL'), getTLDashboard);

// Employee dashboard (Admin, Manager, TL, Employee)
router.get('/employee', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), getEmployeeDashboard);

// Intern dashboard (Admin, Manager, TL, Employee, Intern)
router.get('/intern', protect, authorize('Admin', 'Manager', 'TL', 'Employee', 'Intern'), getInternDashboard);

// Client dashboard (Admin, Client)
router.get('/client', protect, authorize('Admin', 'Client'), getClientDashboard);

export default router;
