// api/pipeline.ts — All AI agent functions with fallback support
import { callClaude, parseClaudeJSON } from './api';
import { UserProfile, EnrichedProfile, CareerMatch, Roadmap, JobMatch } from '../src/types';

const DB = [
  { id:'swe',    title:'Software Engineer',    category:'Technology', salaryMin:95,  salaryMax:180 },
  { id:'ds',     title:'Data Scientist',        category:'Technology', salaryMin:100, salaryMax:175 },
  { id:'pm',     title:'Product Manager',       category:'Business',   salaryMin:110, salaryMax:190 },
  { id:'ux',     title:'UX Designer',           category:'Design',     salaryMin:80,  salaryMax:145 },
  { id:'de',     title:'Data Engineer',        category:'Technology', salaryMin:105, salaryMax:170 },
  { id:'ml',     title:'ML Engineer',          category:'Technology', salaryMin:130, salaryMax:170 },
  { id:'ba',     title:'Business Analyst',      category:'Business',   salaryMin:75,  salaryMax:130 },
  { id:'devops', title:'DevOps Engineer',       category:'Technology', salaryMin:100, salaryMax:175 },
  { id:'fe',     title:'Frontend Developer',   category:'Technology', salaryMin:85,  salaryMax:155 },
  { id:'be',     title:'Backend Developer',     category:'Technology', salaryMin:90,  salaryMax:165 },
  { id:'cloud',  title:'Cloud Engineer',        category:'Technology', salaryMin:95,  salaryMax:170 },
  { id:'sec',    title:'Security Engineer',     category:'Technology', salaryMin:100, salaryMax:175 },
];

// Generate fallback career matches based on user skills
function generateFallbackMatches(p: UserProfile): CareerMatch[] {
  const skillSet = new Set(p.skills.map(s => s.toLowerCase()));
  
  // Score each career based on skill match
  const careerSkills: Record<string, string[]> = {
    'swe': ['Python', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker'],
    'ds': ['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'Statistics', 'Pandas', 'Tableau'],
    'pm': ['Product Management', 'Communication', 'Leadership', 'Agile', 'Project Management'],
    'ux': ['UX Design', 'Figma', 'Communication', 'Research', 'Prototyping'],
    'de': ['Python', 'SQL', 'Docker', 'AWS', 'ETL', 'Data Pipelines'],
    'ml': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Statistics', 'Deep Learning'],
    'ba': ['Excel', 'SQL', 'Data Analysis', 'Communication', 'Tableau', 'Financial Analysis'],
    'devops': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Linux', 'Python'],
    'fe': ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Responsive Design'],
    'be': ['Node.js', 'Python', 'Java', 'SQL', 'APIs', 'Database'],
    'cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'DevOps', 'Networking'],
    'sec': ['Security', 'Network Security', 'Python', 'Ethical Hacking', 'Risk Assessment'],
  };

  const scored = DB.map(career => {
    const required = careerSkills[career.id] || [];
    const matched = required.filter(s => skillSet.has(s.toLowerCase()));
    const skillFit = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 30;
    
    return {
      ...career,
      fitScore: Math.min(95, skillFit + 20),
      skillFit,
      interestFit: 70 + Math.floor(Math.random() * 20),
      marketScore: 70 + Math.floor(Math.random() * 20),
      growthScore: 60 + Math.floor(Math.random() * 30),
      reasoning: `Matches ${matched.length} key skills: ${matched.slice(0, 3).join(', ')}. Strong growth potential in current market.`,
      keyStrengths: matched,
      keyGaps: required.filter(s => !skillSet.has(s.toLowerCase())).slice(0, 5),
    };
  });

  return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
}

// Generate fallback roadmap
function generateFallbackRoadmap(top: CareerMatch): Roadmap {
  return {
    targetCareer: top.title,
    totalMonths: 6,
    weeklyHours: 15,
    phases: [
      {
        title: 'Foundation & Core Skills',
        durationWeeks: 4,
        skills: top.keyGaps?.slice(0, 3) || ['Fundamentals', 'Core Concepts'],
        resources: ['Official Documentation', 'Online Courses', 'Practice Projects'],
        milestone: 'Complete basic exercises and mini-projects',
      },
      {
        title: 'Intermediate Concepts',
        durationWeeks: 6,
        skills: top.keyGaps?.slice(2, 5) || ['Advanced Topics', 'Best Practices'],
        resources: ['Advanced Tutorials', 'Open Source Projects', 'Coding Challenges'],
        milestone: 'Build a complete portfolio project',
      },
      {
        title: 'Advanced & Specialization',
        durationWeeks: 8,
        skills: ['Real-world Applications', 'Performance Optimization', 'System Design'],
        resources: ['Professional Courses', 'Industry Projects', 'Mentorship'],
        milestone: 'Ready for professional work',
      },
    ],
    ninetyDayPlan: [
      'Week 1-2: Complete prerequisites and set up development environment',
      'Week 3-4: Learn core concepts and complete beginner exercises',
      'Week 5-8: Build first project and learn best practices',
      'Week 9-12: Work on portfolio project and prepare for interviews',
    ],
  };
}

// Generate fallback jobs
function generateFallbackJobs(matches: CareerMatch[]): JobMatch[] {
  const topTitles = matches.slice(0, 2).map(m => m.title);
  const companies: Record<string, { name: string; locations: string[] }[]> = {
    'Software Engineer': [
      { name: 'Google', locations: ['Mountain View, CA', 'Remote'] },
      { name: 'Microsoft', locations: ['Seattle, WA', 'Remote'] },
      { name: 'Amazon', locations: ['Seattle, WA', 'Austin, TX'] },
    ],
    'Data Scientist': [
      { name: 'Netflix', locations: ['Los Gatos, CA', 'Remote'] },
      { name: 'Spotify', locations: ['New York, NY', 'Remote'] },
      { name: 'Airbnb', locations: ['San Francisco, CA', 'Remote'] },
    ],
    'Frontend Developer': [
      { name: 'Stripe', locations: ['San Francisco, CA', 'Remote'] },
      { name: 'Shopify', locations: ['Ottawa, ON', 'Remote'] },
    ],
  };

  const jobs: JobMatch[] = [];
  topTitles.forEach((title, idx) => {
    const companyList = companies[title] || [
      { name: 'Tech Corp', locations: ['Remote'] },
      { name: 'Startup Inc', locations: ['Remote'] },
    ];
    companyList.slice(0, 2).forEach((comp, cidx) => {
      jobs.push({
        title,
        company: comp.name,
        location: comp.locations[0],
        salaryRange: `$${matches[idx].salaryMin}k-$${matches[idx].salaryMax}k`,
        matchScore: 75 + cidx * 5,
        readinessLevel: idx === 0 ? 'Ready now' : 'Stretch',
        matchReasons: ['Skills align with job requirements', 'Growth opportunity'],
        skills: matches[idx].keyStrengths?.slice(0, 3) || [],
      });
    });
  });

  return jobs.slice(0, 6);
}

export async function agentProfileAnalyzer(p: UserProfile): Promise<EnrichedProfile> {
  try {
    const raw = await callClaude(
      'You are a career psychologist. Return ONLY valid JSON, no markdown. Schema: {"careerDNA":{"strengths":["..."],"weaknesses":["..."],"motivators":["..."]},"workStyle":"...","inferredTraits":["..."],"candidateArchetypes":["..."]}',
      [{ role:'user', content:`Name:${p.name} Age:${p.age} Location:${p.location} Education:${p.education} Role:${p.currentRole} Exp:${p.yearsExp} Skills:[${p.skills.join(',')}] Values:[${(p.values || []).slice(0,4).join(',')}] Goals:${p.goals}` }],
      800
    );
    return parseClaudeJSON<EnrichedProfile>(raw);
  } catch (error) {
    console.log('Profile analyzer fallback');
    // Fallback based on user profile
    const skills = p.skills || [];
    const isTech = skills.some(s => ['Python', 'JavaScript', 'React', 'SQL'].includes(s));
    
    return {
      careerDNA: {
        strengths: isTech ? ['Analytical', 'Problem Solver', 'Detail-oriented'] : ['Communication', 'Leadership'],
        weaknesses: [],
        motivators: ['Growth', 'Learning', 'Impact'],
      },
      workStyle: 'Collaborative',
      inferredTraits: ['Detail-oriented', 'Self-motivated'],
      candidateArchetypes: ['The Builder'],
    };
  }
}

export async function agentCareerMatcher(p: UserProfile, ep: EnrichedProfile): Promise<CareerMatch[]> {
  try {
    const raw = await callClaude(
      'You are a career matching specialist. Return ONLY a JSON array, no markdown. Each item: {"careerId":"...","fitScore":0-100,"skillFit":0-100,"interestFit":0-100,"marketScore":0-100,"growthScore":0-100,"reasoning":"2 sentences","keyStrengths":["..."],"keyGaps":["..."]}',
      [{ role:'user', content:`Skills:[${p.skills.join(',')}] Values:[${(p.values || []).slice(0,4).join(',')}] Exp:${p.yearsExp} Education:${p.education} Goals:${p.goals} DNA:${JSON.stringify(ep.careerDNA)} Available careers: ${DB.map(d => `${d.id}(${d.title})`).join(',')}. Return 4-5 best matches as JSON array only.` }],
      1200
    );
    const matches = parseClaudeJSON<CareerMatch[]>(raw);
    return matches
      .map(m => ({ ...m, ...(DB.find(c => c.id === m.careerId) ?? DB[0]) }))
      .sort((a, b) => b.fitScore - a.fitScore);
  } catch (error) {
    console.log('Career matcher fallback');
    // Use fallback matching
    return generateFallbackMatches(p);
  }
}

export async function agentRoadmapBuilder(p: UserProfile, top: CareerMatch): Promise<Roadmap> {
  try {
    const raw = await callClaude(
      'You are a curriculum designer. Return ONLY a JSON object, no markdown. Schema: {"totalMonths":number,"weeklyHours":number,"phases":[{"title":"...","durationWeeks":number,"skills":["..."],"resources":["specific name"],"milestone":"..."}],"ninetyDayPlan":["Week 1-2: ...","Week 3-4: ...","Week 5-8: ...","Week 9-12: ..."]} Include 3-4 phases.',
      [{ role:'user', content:`Target:${top.title} CurrentSkills:[${p.skills.join(',')}] KeyGaps:[${(top.keyGaps || []).join(',')}] Exp:${p.yearsExp}` }],
      1200
    );
    const roadmap = parseClaudeJSON<Roadmap>(raw);
    return { ...roadmap, targetCareer: top.title };
  } catch (error) {
    console.log('Roadmap builder fallback');
    return generateFallbackRoadmap(top);
  }
}

export async function agentJobMatcher(p: UserProfile, matches: CareerMatch[]): Promise<JobMatch[]> {
  try {
    const top2 = matches.slice(0, 2).map(c => c.title).join(' and ');
    const raw = await callClaude(
      'You are a recruitment specialist. Return ONLY a JSON array, no markdown. Each: {"title":"...","company":"real company","location":"city or Remote","salaryRange":"$Xk-$Yk","matchScore":0-100,"readinessLevel":"Ready now|Stretch|Future goal","matchReasons":["..."],"skills":["..."]}',
      [{ role:'user', content:`Targets:${top2} Skills:[${p.skills.join(',')}] WorkPref:${p.workType} SalaryFloor:$${p.salaryFloor || '70000'}. Return 5 realistic job listings as JSON array only.` }],
      1000
    );
    return parseClaudeJSON<JobMatch[]>(raw);
  } catch (error) {
    console.log('Job matcher fallback');
    return generateFallbackJobs(matches);
  }
}