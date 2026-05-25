import express from 'express';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin', 'Manager', 'TL'), getEmployees);
router.post('/', protect, authorize('Admin', 'Manager'), createEmployee);
router.put('/:id', protect, authorize('Admin', 'Manager'), updateEmployee);
router.delete('/:id', protect, authorize('Admin'), deleteEmployee);

export default router;
