import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123456789_ca_office');
      const user = await User.findById(decoded.id).populate('role');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user._id.toString();
    const roleName = user.role?.name;

    console.log(`User connected via socket: ${user.name} (${roleName || 'No Role'})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room (like Client Room, Employee Room, etc.)
    if (roleName) {
      socket.join(`role:${roleName}`);
    }

    // Join ticket chat room
    socket.on('joinTicket', async ({ ticketId }) => {
      if (!ticketId) return;
      socket.join(`ticket:${ticketId}`);
      console.log(`User ${user.name} joined ticket chat room ticket:${ticketId}`);

      try {
        // Mark comments from other party as read
        await Ticket.updateOne(
          { _id: ticketId },
          { $set: { "comments.$[elem].read": true } },
          { arrayFilters: [{ "elem.user": { $ne: user._id } }] }
        );

        // Notify other connected party that comments are read
        io.to(`ticket:${ticketId}`).emit('commentsRead', { ticketId });
      } catch (err) {
        console.error('Error marking comments as read on joinTicket:', err.message);
      }
    });

    // Leave ticket chat room
    socket.on('leaveTicket', ({ ticketId }) => {
      if (!ticketId) return;
      socket.leave(`ticket:${ticketId}`);
      console.log(`User ${user.name} left ticket chat room ticket:${ticketId}`);
    });

    // Handle typing status indicators
    socket.on('typing', ({ ticketId, isTyping }) => {
      if (!ticketId) return;
      socket.to(`ticket:${ticketId}`).emit('typing', {
        ticketId,
        userId,
        userName: user.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${user.name}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

// Emit ticketCreated event to Admin, Manager, and Team Lead (TL) rooms
export const emitTicketCreated = (ticket) => {
  if (!io) return;
  io.to('role:Admin').to('role:Manager').to('role:TL').emit('ticketCreated', ticket);
};

// Emit ticketAssigned event to the specific employee, TL, and Manager rooms
export const emitTicketAssigned = (ticket, employeeId) => {
  if (!io) return;
  io.to(`user:${employeeId}`).to('role:Manager').to('role:TL').emit('ticketAssigned', ticket);
};

// Emit ticketUpdated event to all relevant rooms
export const emitTicketUpdated = (ticket, employeeId, clientId) => {
  if (!io) return;
  const target = io.to('role:Admin').to('role:Manager').to('role:TL');
  if (employeeId) target.to(`user:${employeeId}`);
  if (clientId) target.to(`user:${clientId}`);
  target.emit('ticketUpdated', ticket);
};

// Emit ticketClosed event
export const emitTicketClosed = (ticket, employeeId, clientId) => {
  if (!io) return;
  const target = io.to('role:Admin').to('role:Manager').to('role:TL');
  if (employeeId) target.to(`user:${employeeId}`);
  if (clientId) target.to(`user:${clientId}`);
  target.emit('ticketClosed', ticket);
};

// Emit newMessage event (a chat comment)
export const emitNewMessage = (ticketId, comment, recipientId) => {
  if (!io) return;
  io.to(`ticket:${ticketId}`).to(`user:${recipientId}`).to('role:Admin').to('role:Manager').to('role:TL').emit('newMessage', { ticketId, comment });
};

// Emit notificationCreated event
export const emitNotificationCreated = (notification, recipientId) => {
  if (!io) return;
  io.to(`user:${recipientId}`).emit('notificationCreated', notification);
};
