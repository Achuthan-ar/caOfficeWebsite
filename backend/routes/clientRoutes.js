import express from 'express';
import {
  getClientDashboard,
  uploadDocument,
  getClientDocuments,
  reviewDocument,
  updateFilingStatus,
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  searchClients,
  getNextClientId,
} from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Client'), getClientDashboard);
router.post('/documents', protect, uploadDocument);
router.get('/documents', protect, getClientDocuments);
router.put('/documents/:id/review', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), reviewDocument);
router.put('/:id/filing', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), updateFilingStatus);

// Client Master CRUD
router.get('/search', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), searchClients);
router.get('/next-id', protect, authorize('Admin', 'CA Login', 'Manager'), getNextClientId);
router.get('/', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), getClients);
router.post('/', protect, authorize('Admin', 'CA Login', 'Manager'), createClient);
router.get('/:id', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), getClientById);
router.put('/:id', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), updateClient);
router.delete('/:id', protect, authorize('Admin', 'CA Login'), deleteClient);

export default router;
