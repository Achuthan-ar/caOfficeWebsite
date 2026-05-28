import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      const { data } = response.data;
      set({
        user: {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        },
        accessToken: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error on backend:', error.message);
    } finally {
      get().logoutStore();
    }
  },

  logoutStore: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset request failed';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Attempt to refresh token using HttpOnly cookie
      const refreshResponse = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );
      
      const { token } = refreshResponse.data;
      
      if (token) {
        // 2. Fetch user profile using access token
        const profileResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const { data } = profileResponse.data;
        set({
          user: data,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch {
      // Session does not exist or has expired
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
