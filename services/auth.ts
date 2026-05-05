// app/services/auth.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const signup = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/api/signup', { name, email, password });
  if (response.data.access_token) {
    await AsyncStorage.setItem('access_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/api/login', { email, password });
  if (response.data.access_token) {
    await AsyncStorage.setItem('access_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userStr = await AsyncStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('access_token');
  return !!token;
};