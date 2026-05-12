// analyticsTypes.ts - Type definitions for the Analytics Dashboard

export interface TrendingSkill {
  name: string;
  growth?: string;
}

export interface RoleData {
  role: string;
  demand_growth: string;
  avg_salary?: string;
}

export interface EmergingSkill {
  skill: string;
  growth: string;
}

export interface SkillProgress {
  [skill: string]: number; // skill name -> percentage (0-100)
}

export interface UserProgress {
  total_courses_completed: number;
  average_interview_score: number;
  quiz_completions: number;
  skill_progress?: SkillProgress;
}

export interface SkillTrends {
  trending_skills: string[];
  popular_courses: string[];
}

export interface JobMarket {
  top_in_demand_roles: RoleData[];
  emerging_skills: EmergingSkill[];
}

export interface TrendsData {
  trends: SkillTrends;
  user_progress: UserProgress;
  job_market?: JobMarket;
}

export interface AnalyticsState {
  data: TrendsData | null;
  loading: boolean;
  error: string | null;
}

export interface ChartData {
  label: string;
  value: number;
}