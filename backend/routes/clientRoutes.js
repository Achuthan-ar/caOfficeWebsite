import express from 'express';
import {
  getClientDashboard,
  uploadDocument,
  getClientDocuments,
  reviewDocument,
  updateFilingStatus,
  getClients,
  createClient,
} from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Client'), getClientDashboard);
router.post('/documents', protect, uploadDocument);
router.get('/documents', protect, getClientDocuments);
router.put('/documents/:id/review', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), reviewDocument);
router.put('/:id/filing', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), updateFilingStatus);
router.get('/', protect, authorize('Admin', 'Manager', 'TL', 'Employee'), getClients);
router.post('/', protect, authorize('Admin', 'Manager'), createClient);

export default router;
