import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Language } from '../i18n/translations';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  phone_number: string;
  name: string;
  shop_name?: string;
  shop_address?: string;
  shop_latitude?: number;
  shop_longitude?: number;
  language: Language;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  language: Language;
  
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  language: 'en',
  
  login: async (phone: string, pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        phone_number: phone,
        pin: pin
      });
      
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        user, 
        token, 
        isLoading: false,
        language: user.language || 'en'
      });
      
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null });
  },
  
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      const langStr = await AsyncStorage.getItem('language');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ 
          token, 
          user,
          language: langStr as Language || user.language || 'en'
        });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  },
  
  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem('language', lang);
    set({ language: lang });
    
    const { token } = get();
    if (token) {
      try {
        await axios.put(
          `${API_URL}/api/auth/profile`,
          { language: lang },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Failed to update language on server:', error);
      }
    }
  },
  
  updateProfile: async (data: Partial<User>) => {
    const { token, user } = get();
    if (!token || !user) return;
    
    try {
      const response = await axios.put(
        `${API_URL}/api/auth/profile`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, ...response.data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  },
  
  clearError: () => set({ error: null })
}));
