import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  streamNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/stream', protect, streamNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

export default router;
