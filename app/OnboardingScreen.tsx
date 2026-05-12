// ================================================================
// OnboardingScreen.tsx - 5-step career profile wizard
// ================================================================
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated, Alert,
  Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useCareerStore } from '../src/store/careerStore';
import {
  agentProfileAnalyzer, agentCareerMatcher,
  agentRoadmapBuilder, agentJobMatcher,
} from '../services/pipeline';
import { saveOnboarding } from '../services/auth';
import { CareerMatch, Roadmap, JobMatch } from '../src/types/index';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';


const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const USER_BLUE = '#3559a8';

// Callbacks for navigation - will be set from parent
let onCompleteCallback: (() => void) | null = null;
let onBackCallback: (() => void) | null = null;

export const setOnboardingCallbacks = (onComplete: () => void, onBack: () => void) => {
  onCompleteCallback = onComplete;
  onBackCallback = onBack;
};

// ── Static data ───────────────────────────────────────────────────
const SKILLS_LIST = [
  'JavaScript','Python','React','Node.js','SQL','Machine Learning',
  'Data Analysis','Product Management','UX Design','TypeScript','AWS',
  'Docker','Java','Excel','Tableau','Figma','Agile','Leadership',
  'Communication','Project Management','Financial Analysis','Marketing',
  'Content Writing','SEO','Sales','Swift','Kotlin','C++','GraphQL','Kubernetes',
];

const EDUCATION_OPTIONS = [
  'High School',"Associate's","Bachelor's","Master's",'PhD','Bootcamp / Self-taught',
];

const EXPERIENCE_OPTIONS = [
  '0 (Student / Fresher)','1–2 years','3–5 years','6–10 years','10+ years',
];

const WORK_OPTIONS = [
  { value: 'remote', label: '🌐 Remote' },
  { value: 'hybrid', label: '🏙 Hybrid' },
  { value: 'onsite', label: '🏢 On-site' },
];

const STEPS = [
  { title: 'Basic Information',   sub: 'Tell us about yourself' },
  { title: 'Current Role',        sub: 'Where are you in your career?' },
  { title: 'Skills Inventory',    sub: 'Tap every skill you have' },
  { title: 'Values & Priorities', sub: 'Use ↑ ↓ to rank what matters most' },
  { title: 'Goals & Constraints', sub: 'Where do you want to go?' },
];

// ── Component ─────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const {
    profile, setProfile,
    setPipelineRunning, setPipelineComplete, setAgentStatus,
    setEnrichedProfile, setCareerMatches, setRoadmap, setJobs,
    enrichedProfile, careerMatches, roadmap, jobs,
    agentStates,
  } = useCareerStore();

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [agentStep, setAgentStep] = useState('');
  const progressAnim            = useRef(new Animated.Value(1 / STEPS.length)).current;

  const animateTo = (s: number) => {
    Animated.timing(progressAnim, {
      toValue: (s + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validate = useCallback((): boolean => {
    if (step === 0 && !(profile.name || '').trim()) {
      Alert.alert('Required', 'Please enter your name.'); return false;
    }
    if (step === 1 && !(profile.currentRole || '').trim()) {
      Alert.alert('Required', 'Please enter your current role.'); return false;
    }
    if (step === 2 && (profile.skills || []).length === 0) {
      Alert.alert('Select Skills', 'Please pick at least one skill.'); return false;
    }
    return true;
  }, [step, profile.name, profile.currentRole, profile.skills]);

  const next = useCallback(() => {
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      const s = step + 1; setStep(s); animateTo(s);
    } else {
      runPipeline();
    }
  }, [step, validate]);

  const back = useCallback(() => {
    if (step > 0) { 
      const s = step - 1; 
      setStep(s); 
      animateTo(s); 
    } else if (onBackCallback) {
      onBackCallback();
    }
  }, [step]);

  const toggleSkill = useCallback((sk: string) => {
    const currentSkills = profile.skills || [];
    setProfile({
      skills: currentSkills.includes(sk)
        ? currentSkills.filter((s) => s !== sk)
        : [...currentSkills, sk],
    });
  }, [profile.skills, setProfile]);

  const moveValue = useCallback((idx: number, dir: -1 | 1) => {
    const arr = [...(profile.values || [])];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setProfile({ values: arr });
  }, [profile.values, setProfile]);

  // ── Run all 6 agents then navigate to AnalyticsScreen ────────────
  const runPipeline = async () => {
    setLoading(true);
    setPipelineRunning(true);
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Fallback profiles
    const FALLBACK_EP = {
      careerDNA: { 
        strengths: ['Analytical', 'Motivated', 'Quick Learner'], 
        weaknesses: [], 
        motivators: ['Learning', 'Growth'] 
      },
      workStyle: 'Collaborative',
      inferredTraits: ['Detail-oriented', 'Problem Solver'],
      candidateArchetypes: ['The Builder'],
    };

    // Generate fallback matches based on skills
    const generateFallbackMatches = (skills: string[]): CareerMatch[] => {
      const DB = [
        { id:'swe', title:'Software Engineer', category:'Technology', salaryMin:95, salaryMax:180 },
        { id:'ds', title:'Data Scientist', category:'Technology', salaryMin:100, salaryMax:175 },
        { id:'pm', title:'Product Manager', category:'Business', salaryMin:110, salaryMax:190 },
        { id:'ux', title:'UX Designer', category:'Design', salaryMin:80, salaryMax:145 },
        { id:'de', title:'Data Engineer', category:'Technology', salaryMin:105, salaryMax:170 },
        { id:'ml', title:'ML Engineer', category:'Technology', salaryMin:130, salaryMax:170 },
        { id:'devops', title:'DevOps Engineer', category:'Technology', salaryMin:100, salaryMax:175 },
        { id:'fe', title:'Frontend Developer', category:'Technology', salaryMin:85, salaryMax:155 },
        { id:'cloud', title:'Cloud Engineer', category:'Technology', salaryMin:95, salaryMax:170 },
        { id:'be', title:'Backend Developer', category:'Technology', salaryMin:90, salaryMax:165 },
      ];

      const careerSkills: Record<string, string[]> = {
        'swe': ['Python', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS'],
        'ds': ['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'Statistics'],
        'pm': ['Product Management', 'Communication', 'Leadership', 'Agile'],
        'ux': ['UX Design', 'Figma', 'Communication', 'Research'],
        'de': ['Python', 'SQL', 'Docker', 'AWS', 'ETL'],
        'ml': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch'],
        'devops': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD'],
        'fe': ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript'],
        'cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
        'be': ['Node.js', 'Python', 'Java', 'SQL'],
      };

      const skillSet = new Set(skills.map(s => s.toLowerCase()));
      
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
          reasoning: `Matches ${matched.length} key skills: ${matched.slice(0, 3).join(', ')}.`,
          keyStrengths: matched,
          keyGaps: required.filter(s => !skillSet.has(s.toLowerCase())).slice(0, 5),
        };
      });

      return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
    };

    // Generate fallback roadmap
    const generateFallbackRoadmap = (top: CareerMatch): Roadmap => ({
      targetCareer: top.title,
      totalMonths: 6,
      weeklyHours: 15,
      phases: [
        { title: 'Foundation & Core Skills', durationWeeks: 4, skills: top.keyGaps?.slice(0, 3) || ['Fundamentals'], resources: ['Online Courses', 'Practice'], milestone: 'Complete basics' },
        { title: 'Intermediate Concepts', durationWeeks: 6, skills: top.keyGaps?.slice(2, 5) || ['Advanced Topics'], resources: ['Projects', 'Challenges'], milestone: 'Build project' },
        { title: 'Advanced & Portfolio', durationWeeks: 8, skills: ['Real-world Apps', 'Best Practices'], resources: ['Professional Work'], milestone: 'Ready for jobs' },
      ],
      ninetyDayPlan: [
        'Week 1-2: Set up environment and learn basics',
        'Week 3-4: Complete beginner exercises',
        'Week 5-8: Build first project',
        'Week 9-12: Portfolio and interview prep',
      ],
    });

    // Generate fallback jobs
    const generateFallbackJobs = (matches: CareerMatch[]): JobMatch[] => {
      const jobs: JobMatch[] = [];
      matches.slice(0, 2).forEach((match, idx) => {
        ['Tech Corp', 'Startup Inc', 'Innovation Labs'].forEach((company, cidx) => {
          jobs.push({
            title: match.title,
            company,
            location: 'Remote',
            salaryRange: `$${match.salaryMin}k-$${match.salaryMax}k`,
            matchScore: 75 + cidx * 3,
            readinessLevel: idx === 0 ? 'Ready now' : 'Stretch',
            matchReasons: ['Skills match requirements', 'Growth potential'],
            skills: match.keyStrengths?.slice(0, 3) || [],
          });
        });
      });
      return jobs.slice(0, 6);
    };

    try {
      let ep = FALLBACK_EP;
      let matches: CareerMatch[] = [];

      setAgentStep('Analyzing your profile…');
      setAgentStatus('ProfileAnalyzerAgent', 'running');
      try { ep = await agentProfileAnalyzer(profile); }
      catch { ep = FALLBACK_EP; }
      setEnrichedProfile(ep);
      setAgentStatus('ProfileAnalyzerAgent', 'done');
      await sleep(300);

      setAgentStep('Matching career paths…');
      setAgentStatus('CareerMatcherAgent', 'running');
      try { matches = await agentCareerMatcher(profile, ep); }
      catch { matches = generateFallbackMatches(profile.skills || []); }
      if (matches.length === 0) matches = generateFallbackMatches(profile.skills || []);
      setCareerMatches(matches);
      setAgentStatus('CareerMatcherAgent', 'done');
      await sleep(300);

      setAgentStep('Fetching market data…');
      setAgentStatus('MarketIntelAgent', 'running');
      await sleep(500);
      setAgentStatus('MarketIntelAgent', 'done');

      setAgentStep('Computing skill gaps…');
      setAgentStatus('SkillGapAgent', 'running');
      await sleep(300);
      setAgentStatus('SkillGapAgent', 'done');

      setAgentStep('Building your roadmap…');
      setAgentStatus('RoadmapBuilderAgent', 'running');
      const topMatch = matches[0];
      if (topMatch) {
        try { setRoadmap(await agentRoadmapBuilder(profile, topMatch)); }
        catch { setRoadmap(generateFallbackRoadmap(topMatch)); }
      } else {
        const fallbackMatch = generateFallbackMatches(profile.skills || [])[0];
        if (fallbackMatch) setRoadmap(generateFallbackRoadmap(fallbackMatch));
      }
      setAgentStatus('RoadmapBuilderAgent', 'done');
      await sleep(300);

      setAgentStep('Finding matched jobs…');
      setAgentStatus('JobMatcherAgent', 'running');
      if (matches.length > 0) {
        try { setJobs(await agentJobMatcher(profile, matches)); }
        catch { setJobs(generateFallbackJobs(matches)); }
      } else {
        const fallbackMatches = generateFallbackMatches(profile.skills || []);
        if (fallbackMatches.length > 0) setJobs(generateFallbackJobs(fallbackMatches));
      }
      setAgentStatus('JobMatcherAgent', 'done');

      setPipelineComplete(true);
      setPipelineRunning(false);
      setLoading(false);

      // Save onboarding results to backend
      try {
        await saveOnboarding(
          profile,
          enrichedProfile,
          careerMatches,
          roadmap,
          jobs,
          true
        );
        console.log('Onboarding results saved to backend');
      } catch (saveError) {
        console.error('Failed to save onboarding results:', saveError);
        // Don't block the UI - user can still use the app
      }

      if (onCompleteCallback) onCompleteCallback();
    } catch (e) {
      console.error('Pipeline error:', e);
      setLoading(false);
      setPipelineRunning(false);
      // Even on error, generate fallbacks so user gets results
      const fallbackMatches = generateFallbackMatches(profile.skills || []);
      if (fallbackMatches.length > 0) {
        setCareerMatches(fallbackMatches);
        setEnrichedProfile(FALLBACK_EP);
        setRoadmap(generateFallbackRoadmap(fallbackMatches[0]));
        setJobs(generateFallbackJobs(fallbackMatches));
        setPipelineComplete(true);

        // Save onboarding results to backend (fallback data)
        try {
          await saveOnboarding(
            profile,
            FALLBACK_EP,
            fallbackMatches,
            generateFallbackRoadmap(fallbackMatches[0]),
            generateFallbackJobs(fallbackMatches),
            true
          );
          console.log('Onboarding results saved to backend (fallback)');
        } catch (saveError) {
          console.error('Failed to save onboarding results:', saveError);
        }

        if (onCompleteCallback) onCompleteCallback();
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  // ── Loading overlay while pipeline runs ───────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#7F77DD" />
          <Text style={s.loadingTitle}>AI Agents Working</Text>
          <Text style={s.loadingStep}>{agentStep}</Text>
          <View style={s.agentList}>
            {(agentStates || []).map((a) => (
              <View key={a.name} style={s.agentRow}>
                <Text style={[
                  s.agentDot,
                  a.status === 'done'    && { color: '#3B6D11' },
                  a.status === 'running' && { color: '#7F77DD' },
                  a.status === 'waiting' && { color: '#888780' },
                ]}>
                  {a.status === 'done' ? '✓' : a.status === 'running' ? '⚡' : '·'}
                </Text>
                <Text style={[
                  s.agentName,
                  a.status === 'done'    && { color: '#3B6D11' },
                  a.status === 'running' && { color: '#7F77DD' },
                ]}>{a.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={BRAND_GOLD} />
        </TouchableOpacity>
          <Text style={s.headerTitle}>Career Profile Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress bar */}
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: barWidth }]} />
        </View>
        <View style={s.stepRow}>
          <Text style={s.stepCount}>Step {step + 1} of {STEPS.length}</Text>
          <Text style={s.stepDots}>
            {STEPS.map((_, i) => (i <= step ? '●' : '○')).join('  ')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.stepTitle}>{STEPS[step].title}</Text>
          <Text style={s.stepSub}>{STEPS[step].sub}</Text>
          <View>
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <>
                <Field label="Full Name">
                  <TextInput 
                    style={s.input} 
                    value={profile.name || ''}
                    onChangeText={(v) => setProfile({ name: v })}
                    placeholder="e.g. Alex Chen" 
                    placeholderTextColor="#888780"
                    autoCapitalize="words" 
                  />
                </Field>
                <Field label="Age">
                  <TextInput 
                    style={s.input} 
                    value={profile.age || ''}
                    onChangeText={(v) => setProfile({ age: v })}
                    placeholder="e.g. 26" 
                    placeholderTextColor="#888780"
                    keyboardType="numeric" 
                  />
                </Field>
                <Field label="Location">
                  <TextInput 
                    style={s.input} 
                    value={profile.location || ''}
                    onChangeText={(v) => setProfile({ location: v })}
                    placeholder="e.g. Bangalore, India" 
                    placeholderTextColor="#888780" 
                  />
                </Field>
                <Field label="Education Level">
                  <View style={s.chipGrid}>
                    {EDUCATION_OPTIONS.map((e) => (
                      <Chip 
                        key={e} 
                        label={e} 
                        active={profile.education === e}
                        onPress={() => setProfile({ education: e })} 
                      />
                    ))}
                  </View>
                </Field>
              </>
            )}

            {/* Step 1: Current Role */}
            {step === 1 && (
              <>
                <Field label="Current Job Title">
                  <TextInput 
                    style={s.input} 
                    value={profile.currentRole || ''}
                    onChangeText={(v) => setProfile({ currentRole: v })}
                    placeholder="e.g. Junior Developer, Student…"
                    placeholderTextColor="#888780" 
                  />
                </Field>
                <Field label="Years of Experience">
                  <View style={s.chipGrid}>
                    {EXPERIENCE_OPTIONS.map((e) => (
                      <Chip 
                        key={e} 
                        label={e} 
                        active={profile.yearsExp === e}
                        onPress={() => setProfile({ yearsExp: e })} 
                      />
                    ))}
                  </View>
                </Field>
              </>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <>
                <Text style={s.selectedCount}>{(profile.skills || []).length} skills selected</Text>
                <View style={s.skillGrid}>
                  {SKILLS_LIST.map((sk) => {
                    const on = (profile.skills || []).includes(sk);
                    return (
                      <TouchableOpacity
                        key={sk}
                        style={[s.skillTag, on && s.skillTagOn]}
                        onPress={() => toggleSkill(sk)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.skillTagText, on && s.skillTagTextOn]}>{sk}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Step 3: Values */}
            {step === 3 && (profile.values || []).map((v: string, i: number) => (
              <View key={v} style={s.valueRow}>
                <View style={s.rankBadge}><Text style={s.rankNum}>{i + 1}</Text></View>
                <Text style={s.valueLabel}>{v}</Text>
                <TouchableOpacity style={s.arrowBtn} onPress={() => moveValue(i, -1)}>
                  <Text style={s.arrowText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.arrowBtn} onPress={() => moveValue(i, 1)}>
                  <Text style={s.arrowText}>↓</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Step 4: Goals */}
            {step === 4 && (
              <>
                <Field label="Career Goal (1–5 years)">
                  <TextInput 
                    style={[s.input, s.textarea]} 
                    value={profile.goals || ''}
                    onChangeText={(v) => setProfile({ goals: v })}
                    placeholder="e.g. I want to become a senior engineer…"
                    placeholderTextColor="#888780" 
                    multiline 
                    numberOfLines={4}
                    textAlignVertical="top" 
                  />
                </Field>
                <Field label="Minimum Salary (USD / year)">
                  <TextInput 
                    style={s.input} 
                    value={profile.salaryFloor || ''}
                    onChangeText={(v) => setProfile({ salaryFloor: v })}
                    placeholder="e.g. 80000" 
                    placeholderTextColor="#888780"
                    keyboardType="numeric" 
                  />
                </Field>
                <Field label="Work Preference">
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {WORK_OPTIONS.map((w) => (
                      <Chip 
                        key={w.value} 
                        label={w.label}
                        active={profile.workType === w.value}
                        onPress={() => setProfile({ workType: w.value as 'remote' | 'hybrid' | 'onsite' })}
                        flex 
                      />
                    ))}
                  </View>
                </Field>
              </>
            )}
          </View>
        </View>
        
      </ScrollView>

      {/* Nav buttons */}
      <View style={s.navRow}>
        {step > 0
          ? <TouchableOpacity style={s.btnBack} onPress={back}>
              <Text style={s.btnBackText}>← Back</Text>
            </TouchableOpacity>
          : <View style={{ flex: 1 }} />
        }
        <TouchableOpacity style={s.btnNext} onPress={next}>
          <Text style={s.btnNextText}>
            {step === STEPS.length - 1 ? 'Get My Career Plan →' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label, active, onPress, flex,
}: { label: string; active: boolean; onPress: () => void; flex?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.chipActive, flex && { flex: 1 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles — dark theme matching your app ─────────────────────────
const s = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#081833',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',  
    padding: 16, 
    paddingTop: 12 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)', 
    gap: 20,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10264a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f365f', 
  },
  
scroll: {
    flex: 1,
  },

  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    paddingLeft: 13,
  },

stepTitle: { 
  fontSize: 20, 
  fontWeight: '700', 
  color: '#FFFFFF', 
  marginBottom: 4 
},

progressWrap: { 
  paddingHorizontal: 16, 
  paddingBottom: 12 
},


section: {
    backgroundColor: '#10264a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1b335a',
    marginLeft: 16,
    marginRight: 16,
},

// info-section: {
//     backgroundColor: '#1A2535',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 0.5,
//     borderColor: '#2A3A50',
//     marginTop: 16,
// },  

progressTrack: { 
  height: 4, 
  backgroundColor: '#1E2D42', 
  borderRadius: 99, 
  overflow: 'hidden', 
  marginBottom: 8,
  marginTop: 8, 
},

progressFill:   { height: '100%', backgroundColor: '#7F77DD', borderRadius: 99 },
  stepRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  stepCount:      { fontSize: 11, color: '#888780' },
  stepDots:       { fontSize: 11, color: '#7F77DD', letterSpacing: 2 },
  stepSub:        { fontSize: 13, color: '#888780', marginBottom: 24 },
  fieldLabel: 
  { fontSize: 12, 
    color: '#888780', 
    fontWeight: '500', 
    marginBottom: 8 
  },
  input: { 
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 12, 
    color: '#fff' 
  },
  textarea:       { height: 96, paddingTop: 12 },
  chipGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 8 },
  chipActive:     { backgroundColor: '#2D2A5E', borderColor: '#7F77DD' },
  chipText:       { fontSize: 13, color: '#888780' },
  chipTextActive: { color: '#AFA9EC', fontWeight: '500' },
  selectedCount:  { fontSize: 12, color: '#7F77DD', fontWeight: '500', marginBottom: 12 },
  skillGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag:       { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, borderWidth: 0.5, borderColor: '#2A3A50', backgroundColor: '#1A2535' },
  skillTagOn:     { backgroundColor: '#2D2A5E', borderColor: '#7F77DD' },
  skillTagText:   { fontSize: 12, color: '#888780' },
  skillTagTextOn: { color: '#AFA9EC', fontWeight: '500' },
  valueRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A2535', borderRadius: 10, borderWidth: 0.5, borderColor: '#2A3A50', padding: 12, marginBottom: 8, gap: 10 },
  rankBadge:      { width: 24, height: 24, borderRadius: 99, backgroundColor: '#2D2A5E', alignItems: 'center', justifyContent: 'center' },
  rankNum:        { fontSize: 11, color: '#7F77DD', fontWeight: '700' },
  valueLabel:     { flex: 1, fontSize: 13, color: '#FFFFFF' },
  arrowBtn:       { width: 28, height: 28, backgroundColor: '#0F1724', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  arrowText:      { fontSize: 14, color: '#888780' },
  navRow:         { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 0.5, borderTopColor: '#1E2D42', backgroundColor: '#0F1724' },
  btnBack:        { flex: 1, backgroundColor: '#1A2535', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#2A3A50' },
  btnBackText:    { color: '#888780', fontSize: 14, fontWeight: '500' },
  btnNext: { 
    flex: 1, 
    backgroundColor: '#d4a45f', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  btnNextText: { 
    color: '#0a0101cf', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTitle:   { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  loadingStep:    { color: '#7F77DD', fontSize: 13, marginBottom: 32, textAlign: 'center' },
  agentList:      { width: '100%', gap: 10 },
  agentRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentDot:       { fontSize: 16, width: 20 },
  agentName:      { fontSize: 13, color: '#888780' },
});