import { create } from 'zustand';
import api from '../lib/api';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('academix_token');
      const savedUser = localStorage.getItem('academix_user');
      if (token && savedUser) {
        try {
          set({ user: JSON.parse(savedUser) });
        } catch {
          localStorage.clear();
        }
      }
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('academix_token', data.data.token);
      localStorage.setItem('academix_user', JSON.stringify(data.data));
      set({ user: data.data });
      return data.data;
    }
    throw new Error(data.message);
  },

  loginWithGoogle: async () => {
    if (!auth || !googleProvider) {
      throw new Error('Google sign-in is not configured. Contact administrator.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const { data } = await api.post('/auth/google', { idToken });
    if (data.success) {
      localStorage.setItem('academix_token', data.data.token);
      localStorage.setItem('academix_user', JSON.stringify(data.data));
      set({ user: data.data });
      return data.data;
    }
    throw new Error(data.message);
  },

  logout: () => {
    localStorage.removeItem('academix_token');
    localStorage.removeItem('academix_user');
    set({ user: null });
    if (auth) {
      auth.signOut().catch(() => {});
    }
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem('academix_user', JSON.stringify(updated));
    set({ user: updated });
  }
}));
