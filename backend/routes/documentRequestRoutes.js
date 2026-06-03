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

router.post('/', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), createRequest);
router.post('/template', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), createRequestFromTemplate);
router.get('/', protect, getRequests);
router.put('/:id/upload', protect, uploadRequestDocument);
router.put('/:id/review', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), reviewRequest);
router.post('/run-reminders', protect, authorize('Admin', 'Manager', 'TL'), runRemindersCheck);

export default router;
