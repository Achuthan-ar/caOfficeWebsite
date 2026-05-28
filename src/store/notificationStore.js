import { create } from 'zustand';
import api from '../services/api';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  eventSource: null,

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
    // Prevent duplicate stream connections
    if (get().eventSource) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    // Set up EventSource connection using query parameter token authentication
    const streamUrl = `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping' || data.type === 'connected') {
          return; // Ignore keep-alive heartbeats
        }

        // Prepend new notification to the active list
        const updatedList = [data, ...get().notifications];
        set({
          notifications: updatedList,
          unreadCount: updatedList.filter((n) => !n.isRead).length,
        });

        // Trigger visual toast banner alert if callback is provided
        if (onNewNotification) {
          onNewNotification(data);
        }
      } catch (err) {
        console.error('Failed to parse incoming SSE message:', err.message);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Stream Error encountered, closing stream:', err);
      es.close();
      set({ eventSource: null });
      // Retry stream connection after 5 seconds
      setTimeout(() => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          get().connectStream(onNewNotification);
        }
      }, 5000);
    };

    set({ eventSource: es });
  },

  disconnectStream: () => {
    const es = get().eventSource;
    if (es) {
      es.close();
      set({ eventSource: null });
    }
  },
}));
