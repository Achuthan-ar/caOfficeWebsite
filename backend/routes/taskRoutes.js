import express from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addTaskComment,
  getTaskComments,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'Manager', 'TL'), createTask);
router.get('/', protect, getTasks);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, authorize('Admin', 'Manager'), deleteTask);

// Task comments
router.post('/:id/comments', protect, addTaskComment);
router.get('/:id/comments', protect, getTaskComments);

export default router;
