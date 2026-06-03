import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data?.success) {
        const list = response.data.data;
        set({
          notifications: list,
          unreadCount: list.filter((n) => !n.isRead).length,
        });
      }
    } catch (err) {
      console.error('Error fetching notifications list:', err.message);
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data?.success) {
        const updatedList = get().notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        set({
          notifications: updatedList,
          unreadCount: updatedList.filter((n) => !n.isRead).length,
        });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data?.success) {
        const updatedList = get().notifications.map((n) => ({ ...n, isRead: true }));
        set({
          notifications: updatedList,
          unreadCount: 0,
        });
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
    }
  },

  connectStream: (onNewNotification) => {
    // Prevent duplicate socket connections
    if (get().socket) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const SOCKET_URL = API_URL.replace('/api', '');
    const socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket.IO connection established successfully.');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });

    socket.on('notificationCreated', (notification) => {
      // Prepend new notification to the active list
      const updatedList = [notification, ...get().notifications];
      set({
        notifications: updatedList,
        unreadCount: updatedList.filter((n) => !n.isRead).length,
      });

      // Trigger visual toast banner alert if callback is provided
      if (onNewNotification) {
        onNewNotification(notification);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO connection disconnected:', reason);
    });

    set({ socket });
  },

  disconnectStream: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
