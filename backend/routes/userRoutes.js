import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, updateUserPassword } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all users - Admin and Manager allowed
router.get('/', protect, authorize('Admin', 'Manager'), getAllUsers);

// Update user role - Admin only
router.put('/:id/role', protect, authorize('Admin'), updateUserRole);

// Update user password - Admin only
router.put('/:id/password', protect, authorize('Admin'), updateUserPassword);

// Delete user - Admin only
router.delete('/:id', protect, authorize('Admin'), deleteUser);


export default router;
