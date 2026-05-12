// analyticsService.ts - API service for Analytics Dashboard
import { TrendsData } from '../types/analyticsTypes';
import { getApiBaseUrl, getNgrokHeaders } from './config';

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const fetchAnalyticsTrends = async (token: string): Promise<TrendsData> => {
  const ngrokHeaders = getNgrokHeaders();
  const response = await fetch(`${API_BASE_URL}/api/analytics/trends`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...ngrokHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const exportAnalytics = async (token: string, format: 'csv' | 'json' = 'csv'): Promise<void> => {
  const ngrokHeaders = getNgrokHeaders();
  const response = await fetch(`${API_BASE_URL}/api/analytics/export?format=${format}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...ngrokHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export analytics: ${response.status}`);
  }

  // For CSV, trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Fallback data when API is unavailable (for demo/development)
export const getFallbackData = (): TrendsData => ({
  trends: {
    trending_skills: ['Python', 'AI', 'Data Science', 'Cloud', 'DevOps'],
    popular_courses: [],
  },
  user_progress: {
    total_courses_completed: 3,
    average_interview_score: 72,
    quiz_completions: 5,
    skill_progress: {
      'Python': 75,
      'Data Analysis': 60,
      'Machine Learning': 45,
      'Web Development': 30,
      'Cloud Computing': 20,
    },
  },
  job_market: {
    top_in_demand_roles: [
      { role: 'Data Scientist', demand_growth: '+45%', avg_salary: '$120,000' },
      { role: 'AI Engineer', demand_growth: '+60%', avg_salary: '$135,000' },
      { role: 'Full Stack Developer', demand_growth: '+30%', avg_salary: '$110,000' },
      { role: 'DevOps Engineer', demand_growth: '+40%', avg_salary: '$125,000' },
    ],
    emerging_skills: [
      { skill: 'Prompt Engineering', growth: '+200%' },
      { skill: 'RAG Systems', growth: '+150%' },
      { skill: 'MLOps', growth: '+120%' },
      { skill: 'LangChain', growth: '+100%' },
    ],
  },
});