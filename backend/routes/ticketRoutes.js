import express from 'express';
import {
  createTicket,
  getTickets,
  addComment,
  updateTicketStatus,
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Client'), createTicket);
router.get('/', protect, getTickets);
router.post('/:id/comments', protect, addComment);
router.put('/:id', protect, authorize('Admin', 'CA Login', 'Manager', 'Employee'), updateTicketStatus);

export default router;
