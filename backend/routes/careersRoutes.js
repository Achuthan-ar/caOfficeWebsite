import express from 'express';
import {
  getJobs,
  createJob,
  submitApplication,
  getApplications,
  updateApplicationStatus,
} from '../controllers/careersController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/jobs', getJobs);
router.post('/jobs', protect, authorize('Admin', 'Manager'), createJob);
router.post('/apply', submitApplication);
router.get('/applications', protect, authorize('Admin', 'Manager'), getApplications);
router.put('/applications/:id/status', protect, authorize('Admin', 'Manager'), updateApplicationStatus);

export default router;
