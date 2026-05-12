// app/services/auth.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, EnrichedProfile, CareerMatch, Roadmap, JobMatch } from '../src/types';

export interface User {
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Onboarding data structure for backend
interface OnboardingProfileBackend {
  name?: string;
  age?: string;
  location?: string;
  education?: string;
  current_role?: string;
  years_exp?: string;
  skills?: string[];
  values?: string[];
  goals?: string;
  salary_floor?: string;
  work_type?: string;
}

interface OnboardingSaveRequest {
  profile: OnboardingProfileBackend;
  enriched_profile?: EnrichedProfile;
  career_matches?: CareerMatch[];
  roadmap?: Roadmap;
  jobs?: JobMatch[];
  pipeline_complete: boolean;
}

interface OnboardingResponse {
  id: number;
  user_id: number;
  profile: OnboardingProfileBackend | null;
  enriched_profile: EnrichedProfile | null;
  career_matches: CareerMatch[] | null;
  roadmap: Roadmap | null;
  jobs: JobMatch[] | null;
  pipeline_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Convert frontend profile to backend format
const toBackendProfile = (profile: UserProfile): OnboardingProfileBackend => ({
  name: profile.name,
  age: profile.age,
  location: profile.location,
  education: profile.education,
  current_role: profile.currentRole,
  years_exp: profile.yearsExp,
  skills: profile.skills,
  values: profile.values,
  goals: profile.goals,
  salary_floor: profile.salaryFloor,
  work_type: profile.workType,
});

// Convert backend profile to frontend format
const fromBackendProfile = (backend: OnboardingProfileBackend): UserProfile => ({
  name: backend.name || '',
  age: backend.age || '',
  location: backend.location || '',
  education: backend.education || '',
  currentRole: backend.current_role || '',
  yearsExp: backend.years_exp || '',
  skills: backend.skills || [],
  values: backend.values || [],
  goals: backend.goals || '',
  salaryFloor: backend.salary_floor || '',
  workType: (backend.work_type as 'remote' | 'hybrid' | 'onsite') || 'remote',
});

// Onboarding API functions
export const saveOnboarding = async (
  profile: UserProfile,
  enrichedProfile: EnrichedProfile | null,
  careerMatches: CareerMatch[],
  roadmap: Roadmap | null,
  jobs: JobMatch[],
  pipelineComplete: boolean
): Promise<{ id: number; status: string }> => {
  const request: OnboardingSaveRequest = {
    profile: toBackendProfile(profile),
    enriched_profile: enrichedProfile || undefined,
    career_matches: careerMatches.length > 0 ? careerMatches : undefined,
    roadmap: roadmap || undefined,
    jobs: jobs.length > 0 ? jobs : undefined,
    pipeline_complete: pipelineComplete,
  };
  
  const response = await api.post('/api/onboarding', request);
  return response.data;
};

export const loadOnboarding = async (): Promise<{
  profile: UserProfile;
  enrichedProfile: EnrichedProfile | null;
  careerMatches: CareerMatch[];
  roadmap: Roadmap | null;
  jobs: JobMatch[];
  pipelineComplete: boolean;
} | null> => {
  try {
    const response = await api.get<OnboardingResponse>('/api/onboarding');
    const data = response.data;
    
    if (!data.profile) {
      return null;
    }
    
    return {
      profile: fromBackendProfile(data.profile),
      enrichedProfile: data.enriched_profile || null,
      careerMatches: data.career_matches || [],
      roadmap: data.roadmap || null,
      jobs: data.jobs || [],
      pipelineComplete: data.pipeline_complete,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No onboarding results found
    }
    throw error;
  }
};

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