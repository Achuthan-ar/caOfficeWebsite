import Ticket from '../models/Ticket.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendNotification } from '../utils/notification.js';
import AuditLog from '../models/AuditLog.js';
import {
  emitTicketCreated,
  emitTicketAssigned,
  emitTicketUpdated,
  emitTicketClosed,
  emitNewMessage
} from '../services/socketService.js';

// Helper to generate Ticket ID
const generateTicketNumber = async () => {
  const count = await Ticket.countDocuments();
  const serial = String(count + 1).padStart(3, '0');
  const year = new Date().getFullYear();
  return `TKT-${year}-${serial}`;
};

// @desc    Create a support ticket
// @route   POST /api/tickets
// @access  Private (Client only)
export const createTicket = async (req, res) => {
  const { category, title, description, attachments } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({ success: false, message: 'Category, title, and description are required.' });
  }

  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      client: client._id,
      category,
      title,
      description,
      attachments: attachments || [],
      activityTimeline: [
        {
          action: `Ticket created by client: ${req.user.name}`,
          performedBy: req.user._id,
        }
      ]
    });

    // Notify staff: Admin & Managers
    const staffToNotify = await User.find({
      role: { $in: await getReviewerRoles() }
    });

    for (const staff of staffToNotify) {
      await sendNotification({
        recipient: staff._id,
        sender: req.user._id,
        title: 'New Support Ticket Created',
        message: `Client ${client.companyName} created ticket ${ticketNumber}: "${title}".`,
        type: 'Ticket',
        link: '/applications', // dashboard support tracker
      });
    }

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Ticket Created',
      details: `Created support ticket ${ticketNumber}: "${title}"`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Real-time Socket.IO emission
    emitTicketCreated(ticket);

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get support tickets
// @route   GET /api/tickets
// @access  Private (All roles)
export const getTickets = async (req, res) => {
  const { clientId, status, category } = req.query;

  try {
    let query = {};

    if (req.user.role.name === 'Client') {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client profile not found' });
      }
      query.client = client._id;
    } else {
      if (clientId) query.client = clientId;
    }

    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name email employeeId')
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment/message to ticket
// @route   POST /api/tickets/:id/comments
// @access  Private (All roles)
export const addComment = async (req, res) => {
  const { comment, attachments } = req.body;

  if (!comment) {
    return res.status(400).json({ success: false, message: 'Comment text is required.' });
  }

  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'client',
        populate: { path: 'user' }
      })
      .populate('assignedTo');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'This support ticket has been closed and cannot receive comments.' });
    }

    // Append comment
    ticket.comments.push({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role.name,
      comment,
      attachments: attachments || [],
      timestamp: new Date(),
    });

    if (attachments && Array.isArray(attachments)) {
      ticket.attachments.push(...attachments);
    }

    ticket.activityTimeline.push({
      action: `Comment added by ${req.user.name} (${req.user.role.name})`,
      performedBy: req.user._id,
    });

    await ticket.save();

    // Notify receiving side
    if (req.user.role.name === 'Client') {
      // Notify assigned staff or managers
      const recipientId = ticket.assignedTo?._id || (await User.findOne({ email: 'admin@company.com' }))?._id;
      if (recipientId) {
        await sendNotification({
          recipient: recipientId,
          sender: req.user._id,
          title: 'New Support Ticket Reply',
          message: `Client replied in ${ticket.ticketNumber}: "${comment.slice(0, 50)}..."`,
          type: 'Ticket',
          link: '/applications',
        });
      }
    } else {
      // Notify client
      await sendNotification({
        recipient: ticket.client.user._id,
        sender: req.user._id,
        title: 'Support Ticket Updated',
        message: `CA Office replied in ${ticket.ticketNumber}: "${comment.slice(0, 50)}..."`,
        type: 'Ticket',
        link: '/client-dashboard',
      });
    }
    // Real-time Socket.IO emission
    const newComment = ticket.comments[ticket.comments.length - 1];
    const recipientId = req.user.role.name === 'Client'
      ? (ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString())
      : (ticket.client?.user?._id?.toString() || ticket.client?.user?.toString());
      
    if (recipientId) {
      emitNewMessage(ticket._id, newComment, recipientId);
    }
    
    // Also update ticket list for everyone involved
    const clientId = ticket.client?.user?._id?.toString() || ticket.client?.user?.toString();
    const assignedId = ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString();
    emitTicketUpdated(ticket, assignedId, clientId);

    res.json({ success: true, message: 'Comment added successfully.', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update ticket status and assignment
// @route   PUT /api/tickets/:id
// @access  Private (Staff only)
export const updateTicketStatus = async (req, res) => {
  const { status, assignedToId } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'client',
        populate: { path: 'user' }
      });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) {
      ticket.status = status;
      ticket.activityTimeline.push({
        action: `Status updated to ${status} by ${req.user.name}`,
        performedBy: req.user._id,
      });

      // Notify Client
      await sendNotification({
        recipient: ticket.client.user._id,
        sender: req.user._id,
        title: `Ticket Status Updated: ${status}`,
        message: `Your ticket ${ticket.ticketNumber} was updated to: ${status}.`,
        type: 'Ticket',
        link: '/client-dashboard',
      });
    }

    if (assignedToId) {
      const currentAssignee = ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString() || '';
      if (assignedToId !== currentAssignee) {
        const staff = await User.findById(assignedToId);
        if (!staff) {
          return res.status(404).json({ success: false, message: 'Assignee staff user not found' });
        }

        ticket.assignedTo = assignedToId;
        ticket.status = 'Assigned';
        ticket.activityTimeline.push({
          action: `Ticket assigned to ${staff.name} by ${req.user.name}`,
          performedBy: req.user._id,
        });

        // Notify staff assignee
        await sendNotification({
          recipient: assignedToId,
          sender: req.user._id,
          title: 'New Support Ticket Assigned',
          message: `You have been assigned support ticket: ${ticket.ticketNumber} ("${ticket.title}").`,
          type: 'Ticket',
          link: '/applications',
        });
      }
    }

    await ticket.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Ticket Updated',
      details: `Updated support ticket ${ticket.ticketNumber} (Status: ${status || ticket.status})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Real-time Socket.IO emissions
    const clientId = ticket.client?.user?._id?.toString() || ticket.client?.user?.toString();
    const assignedId = ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString();
    if (status === 'Closed') {
      emitTicketClosed(ticket, assignedId, clientId);
    } else {
      if (assignedToId) {
        emitTicketAssigned(ticket, assignedId);
      }
      emitTicketUpdated(ticket, assignedId, clientId);
    }

    res.json({ success: true, message: 'Ticket updated successfully.', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve Admin, Manager, and TL roles for routing alerts
const getReviewerRoles = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'Manager', 'TL'] } });
  return roles.map(r => r._id);
};
