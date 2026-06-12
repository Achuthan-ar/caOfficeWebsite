import express from 'express';
import {
  getMasterList,
  createMasterEntry,
  updateMasterEntry,
  deleteMasterEntry,
} from '../controllers/masterController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// CRUD operations on Master Lists categories (services, accountants, client-types, case-types, regularity-types)
router.get('/:category', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), getMasterList);
router.post('/:category', protect, authorize('Admin', 'CA Login', 'Manager'), createMasterEntry);
router.put('/:category/:id', protect, authorize('Admin', 'CA Login', 'Manager'), updateMasterEntry);
router.delete('/:category/:id', protect, authorize('Admin', 'CA Login'), deleteMasterEntry);

export default router;
