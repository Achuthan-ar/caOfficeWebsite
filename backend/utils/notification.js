import Notification from '../models/Notification.js';

// Global memory list of active SSE streams
let clients = [];

export const addSSEClient = (userId, res) => {
  clients.push({ userId: userId.toString(), res });
  console.log(`SSE Client added. User: ${userId}. Total active clients: ${clients.length}`);
};

export const removeSSEClient = (userId, res) => {
  clients = clients.filter(c => !(c.userId === userId.toString() && c.res === res));
  console.log(`SSE Client removed. User: ${userId}. Total active clients: ${clients.length}`);
};

export const sendNotification = async ({ recipient, sender, title, message, type, link }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      link,
    });

    // Populate sender details for notifications UI
    const populated = await Notification.findById(notification._id).populate('sender', 'name');

    // Broadcast in real-time to active SSE streams for this user
    const recipientIdStr = recipient.toString();
    const userStreams = clients.filter(c => c.userId === recipientIdStr);
    
    userStreams.forEach(client => {
      try {
        client.res.write(`data: ${JSON.stringify(populated)}\n\n`);
      } catch (err) {
        console.error(`Error writing SSE data stream for user ${recipientIdStr}:`, err.message);
      }
    });
  } catch (error) {
    console.error('Error creating/broadcasting notification:', error.message);
  }
};
