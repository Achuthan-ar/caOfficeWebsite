import express from 'express';
import {
  createRequest,
  createRequestFromTemplate,
  getRequests,
  uploadRequestDocument,
  reviewRequest,
  runRemindersCheck,
} from '../controllers/documentRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), createRequest);
router.post('/template', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), createRequestFromTemplate);
router.get('/', protect, getRequests);
router.put('/:id/upload', protect, uploadRequestDocument);
router.put('/:id/review', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), reviewRequest);
router.post('/run-reminders', protect, authorize('Admin', 'CA Login', 'Manager'), runRemindersCheck);

export default router;
