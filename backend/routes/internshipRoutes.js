import express from 'express';
import {
  getInternDashboard,
  getMentorMentees,
  getInternshipDetails,
  submitReport,
  reviewReport,
  assignTask,
  updateTaskStatus,
  generateCertificate,
  getCertificate,
} from '../controllers/internshipController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Intern'), getInternDashboard);
router.get('/mentees', protect, authorize('TL', 'Employee', 'Manager'), getMentorMentees);
router.get('/certificates/:id', protect, getCertificate);
router.get('/:id', protect, getInternshipDetails);
router.post('/reports', protect, authorize('Intern'), submitReport);
router.put('/reports/:reportId/review', protect, authorize('TL', 'Employee', 'Manager'), reviewReport);
router.post('/:id/tasks', protect, authorize('TL', 'Employee', 'Manager'), assignTask);
router.put('/:id/tasks/:taskId', protect, updateTaskStatus);
router.post('/:id/certificate', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), generateCertificate);

export default router;
