// types/index.ts

export interface UserProfile {
  name: string; 
  age: string; 
  location: string; 
  education: string;
  currentRole: string; 
  yearsExp: string; 
  skills: string[]; 
  values: string[];
  goals: string; 
  salaryFloor: string; 
  workType: 'remote' | 'hybrid' | 'onsite';
}
export interface CareerDNA { 
  strengths: string[]; 
  weaknesses: string[]; 
  motivators: string[]; 
}
export interface EnrichedProfile {
  careerDNA: CareerDNA; 
  workStyle: string;
  inferredTraits: string[]; 
  candidateArchetypes: string[];
}
export interface CareerMatch {
  careerId: string; 
  title: string; 
  category: string;
  fitScore: number; 
  skillFit: number; 
  interestFit: number;
  marketScore: number; 
  growthScore: number;
  reasoning: string; 
  keyStrengths: string[]; 
  keyGaps: string[];
  salaryMin: number; 
  salaryMax: number;
}
export interface RoadmapPhase {
  title: string; 
  durationWeeks: number;
  skills: string[]; 
  resources: string[]; 
  milestone: string;
}
export interface Roadmap {
  targetCareer: string; 
  totalMonths: number; 
  weeklyHours: number;
  phases: RoadmapPhase[]; 
  ninetyDayPlan: string[];
}
export interface JobMatch {
  title: string; 
  company: string; 
  location: string; 
  salaryRange: string;
  matchScore: number; 
  readinessLevel: 'Ready now' | 'Stretch' | 'Future goal';
  matchReasons: string[]; 
  skills: string[];
}
export interface ChatMessage { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; }
export type AgentStatus = 'waiting' | 'running' | 'done' | 'error';
export interface AgentState { 
  name: string; 
  status: AgentStatus; 
  label: string; 
}