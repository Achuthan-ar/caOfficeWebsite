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
router.get('/mentees', protect, authorize('Manager', 'Employee', 'CA Login'), getMentorMentees);
router.get('/certificates/:id', protect, getCertificate);
router.get('/:id', protect, getInternshipDetails);
router.post('/reports', protect, authorize('Intern'), submitReport);
router.put('/reports/:reportId/review', protect, authorize('Manager', 'Employee', 'CA Login'), reviewReport);
router.post('/:id/tasks', protect, authorize('Manager', 'Employee', 'CA Login'), assignTask);
router.put('/:id/tasks/:taskId', protect, updateTaskStatus);
router.post('/:id/certificate', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), generateCertificate);

export default router;
