import express from 'express';
import {
  createTask,
  getNextTaskId,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addTaskComment,
  getTaskComments,
  remindPendingTasks,
  getKanbanTasks,
  getTasksByClient,
  getTasksByEmployee,
  getTasksStats,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateSchema, taskSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'CA Login', 'Manager'), validateSchema(taskSchema), createTask);
router.post('/remind-pending', protect, authorize('Admin', 'CA Login', 'Manager'), remindPendingTasks);
router.get('/', protect, getTasks);
router.get('/kanban', protect, getKanbanTasks);
router.get('/client/:clientId', protect, getTasksByClient);
router.get('/employee/:employeeId', protect, getTasksByEmployee);
router.get('/stats', protect, getTasksStats);
router.get('/next-id', protect, getNextTaskId);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, authorize('Admin', 'CA Login', 'Manager'), deleteTask);

// Task comments
router.post('/:id/comments', protect, addTaskComment);
router.get('/:id/comments', protect, getTaskComments);

export default router;
