import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.login({ email, password });
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.message || 'Login failed' });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.register({ name, email, password });
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.message || 'Registration failed' });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      set({ user: JSON.parse(stored), isAuthenticated: true });
    }
  },

  clearError: () => set({ error: null }),
}));
