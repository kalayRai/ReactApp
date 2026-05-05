// app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================
const USE_NGROK = false; // Set to true to use ngrok, false to use local IP (same WiFi)
const NGROK_URL = 'https://debrah-ugsome-nonprofanely.ngrok-free.dev'; // Replace with your actual ngrok URL
const YOUR_COMPUTER_IP = '192.168.1.7';
const LOCAL_PORT = '8000';

const getBaseUrl = () => {
  if (USE_NGROK) {
    console.log('🔗 Using NGROK tunnel (Internet)');
    return NGROK_URL;
  } else {
    console.log('🏠 Using Local IP (Same WiFi)');
    return `http://${YOUR_COMPUTER_IP}:${LOCAL_PORT}`;
  }
};

const API_BASE_URL = getBaseUrl();

// ============================================
// AXIOS INSTANCE - THIS IS THE KEY FIX
// ============================================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // ✅ CRITICAL FIX: This header tells ngrok to skip the warning page
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 30000,
});

// Request Interceptor (Ensures token is added AND header is preserved)
api.interceptors.request.use(async (config) => {
  // ✅ IMPORTANT: Re-add the header to be absolutely sure it's there
  config.headers['ngrok-skip-browser-warning'] = 'true';
  
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Response Interceptor (For debugging)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api;