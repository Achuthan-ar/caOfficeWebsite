import express from 'express';
import {
  createInvoice,
  getInvoices,
  recordPayment,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'CA Login'), createInvoice);
router.get('/', protect, getInvoices);
router.post('/:id/payments', protect, authorize('Admin', 'CA Login'), recordPayment);

export default router;
