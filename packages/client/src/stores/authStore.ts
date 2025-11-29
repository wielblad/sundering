import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type User, type UserProfile } from '../services/api';
import { colyseusService } from '../services/colyseus';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (username: string, email: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });

        const { data, error } = await authApi.register(username, email, password);

        if (error) {
          set({ isLoading: false, error });
          return false;
        }

        if (data) {
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });
          return true;
        }

        return false;
      },

      login: async (username, password) => {
        set({ isLoading: true, error: null });

        const { data, error } = await authApi.login(username, password);

        if (error) {
          set({ isLoading: false, error });
          return false;
        }

        if (data) {
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });
          return true;
        }

        return false;
      },

      logout: async () => {
        const token = get().token;
        if (token) {
          await authApi.logout();
          await colyseusService.leaveLobby();
        }

        localStorage.removeItem('token');
        set({
          user: null,
          profile: null,
          token: null,
          error: null,
        });
      },

      fetchProfile: async () => {
        const { data, error } = await authApi.getProfile();

        if (error) {
          // Token might be invalid, logout
          if (error.includes('Invalid') || error.includes('401')) {
            get().logout();
          }
          return;
        }

        if (data) {
          set({ profile: data, user: data });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'punch-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
