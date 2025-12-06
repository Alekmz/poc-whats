import Cookies from 'js-cookie';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  active: boolean;
}

export const auth = {
  login: async (email: string, password: string) => {
    const data = await api.login(email, password);
    Cookies.set('token', data.token, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    return data.user;
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getToken: () => {
    return Cookies.get('token');
  },

  isAuthenticated: () => {
    return !!Cookies.get('token');
  },

  getUser: async (): Promise<User | null> => {
    try {
      return await api.getMe();
    } catch {
      return null;
    }
  },

  hasRole: (user: User | null, roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  },
};

