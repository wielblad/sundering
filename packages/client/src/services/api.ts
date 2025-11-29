const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_banned: boolean;
}

export interface UserProfile extends User {
  stats: {
    games_played: number;
    games_won: number;
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    mmr: number;
    rank_tier: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ActiveGameResponse {
  hasActiveGame: boolean;
  canReconnect?: boolean;
  matchId?: string;
  roomId?: string;
  team?: 'radiant' | 'dire';
  heroId?: string;
  disconnectedAt?: number;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getProfile: () => request<UserProfile>('/api/auth/me'),

  getActiveGame: () => request<ActiveGameResponse>('/api/auth/active-game'),
};
