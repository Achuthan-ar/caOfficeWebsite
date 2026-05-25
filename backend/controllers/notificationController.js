import Notification from '../models/Notification.js';
import { addSSEClient, removeSSEClient } from '../utils/notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private (All staff)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 notifications

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Recipient only)
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this notification' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private (All staff)
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register SSE Stream for real-time notifications
// @route   GET /api/notifications/stream
// @access  Private (All authenticated users)
export const streamNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id;

  // Add client to memory broker
  addSSEClient(userId, res);

  // Send initial connected confirmation
  res.write('data: {"type": "connected"}\n\n');

  // Keep-alive ping interval to prevent connection timeouts on Cloudflare/Render
  const pingInterval = setInterval(() => {
    try {
      res.write('data: {"type": "ping"}\n\n');
    } catch (err) {
      clearInterval(pingInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    removeSSEClient(userId, res);
    res.end();
  });
};
