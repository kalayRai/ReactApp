// // app/services/chat.ts
// import api from './api';

// export interface Message {
//   id: string;
//   text: string;
//   sender: 'user' | 'bot';
//   timestamp: Date;
// }

// export const sendMessage = async (message: string): Promise<string> => {
//   const response = await api.post('/api/chat', { message });
//   return response.data.reply;
// };

// export const generateRoadmap = async (career: string, level: string): Promise<any> => {
//   const response = await api.post('/generate-roadmap', { career, level });
//   return response.data;
// };

// export const searchCourses = async (query: string): Promise<any[]> => {
//   const response = await api.post('/get-courses', { query });
//   return response.data.results;
// };

// app/services/chat.ts
import api from './api';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const sendMessage = async (message: string): Promise<string> => {
  const response = await api.post('/api/chat', { message });
  return response.data.reply;
};

export const generateRoadmap = async (career: string, level: string): Promise<any> => {
  // Try multiple possible endpoint patterns
  try {
    // Pattern 1: /api/generate-roadmap (most common)
    const response = await api.post('/api/generate-roadmap', { career, level });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Pattern 2: /api/roadmap/generate
      try {
        const response = await api.post('/api/roadmap/generate', { career, level });
        return response.data;
      } catch (e) {
        // Pattern 3: /generate-roadmap
        const response = await api.post('/generate-roadmap', { career, level });
        return response.data;
      }
    }
    throw error;
  }
};

export const searchCourses = async (query: string): Promise<any[]> => {
  const response = await api.post('/api/get-courses', { query });
  return response.data.results;
};