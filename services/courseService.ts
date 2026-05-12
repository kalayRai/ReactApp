// coursesService.ts - API service for Courses page (powered by services/scraper_service.py)
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, getNgrokHeaders } from './config';

const API_BASE_URL = getApiBaseUrl();

// ======================================================
// TYPES
// ======================================================

export interface Course {
  title: string;
  platform: string;
  url: string;
  skills: string[];
  rating?: number;
  enrolled_count?: number;
  price?: string;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  query: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ======================================================
// MAIN API FUNCTION - scrapes courses via backend
// ======================================================

export const scrapeCourses = async (token: string, query: string): Promise<CoursesResponse> => {
  const ngrokHeaders = getNgrokHeaders();
  const response = await fetch(`${API_BASE_URL}/api/scrape-courses?query=${encodeURIComponent(query)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...ngrokHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to scrape courses: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// ======================================================
// BACKUP: CSV-based course lookup (no auth required)
// ======================================================

export const searchCoursesFromCSV = async (query: string): Promise<CoursesResponse> => {
  const ngrokHeaders = getNgrokHeaders();
  const response = await fetch(`${API_BASE_URL}/get-courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...ngrokHeaders,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Failed to search courses: ${response.status}`);
  }

  const data = await response.json();
  return {
    courses: data.results.map((r: any) => ({
      title: r.course_title,
      platform: r.platform,
      url: r.url,
      skills: r.skills ? r.skills.split(',').map((s: string) => s.trim()) : [],
    })),
    total: data.total_results,
    query: data.query,
  };
};

// ======================================================
// PLATFORM HELPERS
// ======================================================

export const PLATFORMS = {
  coursera: { name: 'Coursera', color: '#0056D2', icon: '🏛️' },
  udemy: { name: 'Udemy', color: '#A435F0', icon: '💻' },
  edx: { name: 'edX', color: '#02262B', icon: '🎓' },
  linkedin: { name: 'LinkedIn Learning', color: '#0A66C2', icon: '🔗' },
  pluralsight: { name: 'Pluralsight', color: '#F05E23', icon: '⚡' },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

export const getPlatformInfo = (platform: string): { name: string; color: string; icon: string } => {
  const key = Object.keys(PLATFORMS).find(k => platform.toLowerCase().includes(k));
  return key ? PLATFORMS[key as PlatformKey] : { name: platform, color: '#888', icon: '📚' };
};

// ======================================================
// FALLBACK DATA (for demo/development when API is down)
// ======================================================

export const getFallbackCourses = (): Course[] => [
  {
    title: 'Machine Learning Specialization',
    platform: 'Coursera',
    url: '#',
    skills: ['Python', 'ML', 'Deep Learning'],
    rating: 4.8,
    enrolled_count: 120000,
    price: 'Free',
  },
  {
    title: 'Full Stack Web Developer Bootcamp',
    platform: 'Udemy',
    url: '#',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    rating: 4.7,
    enrolled_count: 85000,
    price: '$19.99',
  },
  {
    title: 'Data Science MicroMasters',
    platform: 'edX',
    url: '#',
    skills: ['Python', 'Pandas', 'Statistics', 'ML'],
    rating: 4.6,
    enrolled_count: 45000,
    price: '$300',
  },
  {
    title: 'Google Data Analytics Professional Certificate',
    platform: 'Coursera',
    url: '#',
    skills: ['SQL', 'Data Analysis', 'Tableau', 'Excel'],
    rating: 4.7,
    enrolled_count: 200000,
    price: 'Free',
  },
  {
    title: 'AWS Certified Solutions Architect',
    platform: 'Udemy',
    url: '#',
    skills: ['AWS', 'Cloud', 'Architecture'],
    rating: 4.5,
    enrolled_count: 60000,
    price: '$24.99',
  },
  {
    title: 'CS50x: Introduction to Computer Science',
    platform: 'edX',
    url: '#',
    skills: ['C', 'Python', 'SQL', 'Algorithms'],
    rating: 4.9,
    enrolled_count: 150000,
    price: 'Free',
  },
];

// ======================================================
// COURSE CARD COMPONENT DATA TRANSFORMER
// ======================================================

export const formatCourseForCard = (course: Course) => {
  const platform = getPlatformInfo(course.platform);

  return {
    ...course,
    platformDisplay: platform.name,
    platformColor: platform.color,
    platformIcon: platform.icon,
    skillTags: course.skills?.slice(0, 3) || [],
    ratingDisplay: course.rating ? `${course.rating}/5` : 'N/A',
    enrolledDisplay: course.enrolled_count
      ? course.enrolled_count >= 1000
        ? `${(course.enrolled_count / 1000).toFixed(0)}k enrolled`
        : `${course.enrolled_count} enrolled`
      : null,
  };
};
