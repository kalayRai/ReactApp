// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useCareerStore } from '../src/store/careerStore';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // ✅ Try the WORKING endpoint first
        const userEndpoints = [
          '/api/user/profile',     // ✅ This one works (returned 200)
          '/api/auth/me',          // ❌ This one doesn't exist
          '/api/user',
          '/user/profile',
        ];
        
        let userData = null;
        for (const endpoint of userEndpoints) {
          try {
            console.log(`Trying auth check at: ${endpoint}`);
            const response = await api.get(endpoint);
            userData = response.data;
            console.log(`✅ Auth check successful on: ${endpoint}`);
            break;
          } catch (e: any) {
            if (e.response?.status !== 404) {
              console.log(`⚠️ Failed on ${endpoint}:`, e.response?.status);
            }
          }
        }
        
        if (userData) {
          setUser(userData);
        } else {
          // If no endpoint works, token might be invalid
          await AsyncStorage.removeItem('access_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

const login = async (email: string, password: string) => {
    try {
      // Try the login endpoint directly - no preflight health check needed
      const loginEndpoints = [
        '/api/login',              // ✅ This one worked in your logs
        '/api/auth/login',
        '/auth/login',
        '/login'
      ];

      let response;
      for (const endpoint of loginEndpoints) {
        try {
          console.log(`Trying login at: ${endpoint}`);
          response = await api.post(endpoint, { email, password });
          console.log(`✅ Login successful on: ${endpoint}`);
          break;
        } catch (e: any) {
          console.log(`Failed on ${endpoint}:`, e.response?.status);
        }
      }

      if (!response) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Handle response format
      let access_token;
      let userData;

      if (response.data.access_token) {
        access_token = response.data.access_token;
        userData = response.data.user || response.data;
      } else if (response.data.token) {
        access_token = response.data.token;
        userData = response.data.user || response.data;
      } else {
        access_token = 'temp_' + Date.now();
        userData = response.data;
      }

      await AsyncStorage.setItem('access_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);

    } catch (error: any) {
      console.error('Login error:', error.message || error.response?.data);
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Login failed. Please check your connection.';
      throw new Error(message);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      // Try signup endpoints directly - no preflight health check needed
      const signupEndpoints = [
        '/api/signup',
        '/api/auth/signup',
        '/auth/signup',
        '/signup'
      ];

      let response;
      for (const endpoint of signupEndpoints) {
        try {
          console.log(`Trying signup at: ${endpoint}`);
          response = await api.post(endpoint, { name, email, password });
          console.log(`✅ Signup successful on: ${endpoint}`);
          break;
        } catch (e: any) {
          console.log(`Failed on ${endpoint}:`, e.response?.status);
        }
      }

      if (!response) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      let access_token;
      let userData;

      if (response.data.access_token) {
        access_token = response.data.access_token;
        userData = response.data.user || response.data;
      } else if (response.data.token) {
        access_token = response.data.token;
        userData = response.data.user || response.data;
      } else {
        access_token = 'temp_' + Date.now();
        userData = response.data;
      }

      await AsyncStorage.setItem('access_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);

    } catch (error: any) {
      console.error('Signup error:', error.message || error.response?.data);
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Signup failed. Please check your connection.';
      throw new Error(message);
    }
  };

  const logout = async () => {
    // Clear onboarding results from Zustand store before clearing auth token
    useCareerStore.getState().resetPipeline();
    await AsyncStorage.removeItem('access_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};