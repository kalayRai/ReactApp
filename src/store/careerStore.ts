// store/careerStore.ts — Zustand global state
import { create } from 'zustand';
import { UserProfile, EnrichedProfile, CareerMatch, Roadmap, JobMatch, ChatMessage, AgentState } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  name:'', age:'', location:'', education:'',
  currentRole:'', yearsExp:'', skills:[],
  values:['Creativity','Stability','High Income','Social Impact','Flexibility','Learning','Leadership','Work-Life Balance'],
  goals:'', salaryFloor:'', workType:'remote',
};

const AGENTS: AgentState[] = [
  { name:'ProfileAnalyzerAgent', status:'waiting', label:'Analyzing your profile & career DNA...' },
  { name:'CareerMatcherAgent',   status:'waiting', label:'Matching against 500+ career paths...' },
  { name:'MarketIntelAgent',     status:'waiting', label:'Fetching real-time market data...' },
  { name:'SkillGapAgent',        status:'waiting', label:'Computing skill gaps for top matches...' },
  { name:'RoadmapBuilderAgent',  status:'waiting', label:'Building personalized learning roadmap...' },
  { name:'JobMatcherAgent',      status:'waiting', label:'Finding AI-matched job listings...' },
];

interface Store {
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  resetAll: () => void;
  // Pipeline state
  pipelineRunning: boolean;
  pipelineComplete: boolean;
  agentStates: AgentState[];
  setPipelineRunning: (v: boolean) => void;
  setPipelineComplete: (v: boolean) => void;
  setAgentStatus: (name: string, status: AgentState['status']) => void;
  resetAgents: () => void;
  resetPipeline: () => void;
  //AI results
  enrichedProfile: EnrichedProfile | null;
  careerMatches: CareerMatch[];
  roadmap: Roadmap | null;
  jobs: JobMatch[];
  setEnrichedProfile: (p: EnrichedProfile) => void;
  setCareerMatches: (m: CareerMatch[]) => void;
  setRoadmap: (r: Roadmap) => void;
  setJobs: (j: JobMatch[]) => void;

  chatHistory: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  clearChat: () => void;
}

export const useCareerStore = create<Store>((set) => ({
  profile: { ...DEFAULT_PROFILE },
  setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
  resetAll: () => set({
    profile: { ...DEFAULT_PROFILE },
    pipelineRunning: false, pipelineComplete: false,
    enrichedProfile: null, careerMatches: [], roadmap: null, jobs: [],
    agentStates: AGENTS.map(a => ({ ...a })),
  }),

  pipelineRunning: false, 
  pipelineComplete: false,
  agentStates: AGENTS.map(a => ({ ...a })),
  setPipelineRunning:  (v) => set({ pipelineRunning: v }),
  setPipelineComplete: (v) => set({ pipelineComplete: v }),
  setAgentStatus: (name, status) =>
    set((s) => ({ 
      agentStates: s.agentStates.map(a => 
        a.name === name ? { ...a, status } : a
      ),
     })),
  resetPipeline: () => 
    set({ pipelineRunning: false, 
      pipelineComplete: false,
      enrichedProfile: null, 
      careerMatches: [], 
      roadmap: null, 
      jobs: [],
      agentStates: AGENTS.map(a => ({ ...a })) 
    }),

  enrichedProfile: null, 
  careerMatches: [], 
  roadmap: null, 
  jobs: [],
  setEnrichedProfile: (p) => set({ enrichedProfile: p }),
  setCareerMatches:   (m) => set({ careerMatches: m }),
  setRoadmap:         (r) => set({ roadmap: r }),
  setJobs:            (j) => set({ jobs: j }),

  chatHistory: [],
  addMessage: (m) => set((s) => ({ chatHistory: [...s.chatHistory, m] })),
  clearChat:  ()  => set({ chatHistory: [] }),
}));
  