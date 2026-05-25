import Notification from '../models/Notification.js';

export const sendNotification = async ({ recipient, sender, title, message, type, link }) => {
  try {
    await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      link,
    });
  } catch (error) {
    console.error('Error creating notification document:', error.message);
  }
};
