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
router.post('/jobs', protect, authorize('Admin', 'CA Login'), createJob);
router.post('/apply', submitApplication);
router.get('/applications', protect, authorize('Admin', 'CA Login'), getApplications);
router.put('/applications/:id/status', protect, authorize('Admin', 'CA Login'), updateApplicationStatus);

export default router;
