import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCareerStore } from '../../src/store/careerStore';
import { callClaude, parseClaudeJSON } from '../../services/api';
import { loadOnboarding } from '../../services/auth';
import {
  loadCSVCourses,
  getCoursesBySkill,
  CSVCourse,
} from '../../services/csvCourseLoader';

const PHASE_COLORS = ['#534AB7', '#1D9E75', '#D85A30', '#378ADD', '#854F0B'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

interface GeneratedRoadmap {
  title: string;
  level: string;
  totalDuration: string;
  overview: string;
  phases: {
    phase: string;
    duration: string;
    skills: string[];
    resources: string[];
    milestone: string;
  }[];
  tips: string[];
}

export default function RoadmapScreen() {
  const router = useRouter();
  const { roadmap, pipelineComplete } = useCareerStore();

  // Generator state
  const [careerInput, setCareerInput] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedRoadmap | null>(null);
  const [error, setError] = useState('');

  // CSV Courses state for linked courses
  const [allCourses, setAllCourses] = useState<CSVCourse[]>([]);

  // Load CSV courses on mount
  useEffect(() => {
    loadCoursesForRoadmap();
  }, []);

  const loadCoursesForRoadmap = async () => {
    try {
      const courses = await loadCSVCourses();
      setAllCourses(courses);
    } catch (error) {
      console.error('Error loading courses for roadmap:', error);
    }
  };

  // Get related courses for a skill
  const getRelatedCourses = (skill: string, limit = 3): CSVCourse[] => {
    const normalizedSkill = skill.toLowerCase();
    return allCourses
      .filter(course => 
        course.skills.some(s => s.toLowerCase().includes(normalizedSkill))
      )
      .slice(0, limit);
  };

  const openCourse = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const generateRoadmap = async () => {
    if (!careerInput.trim()) {
      setError('Please enter a career path.');
      return;
    }
    setError('');
    setGenerated(null);
    setLoading(true);

    try {
      const raw = await callClaude(
        'You are a career roadmap expert. Return ONLY a valid JSON object, no markdown, no extra text. ' +
        'Schema: {"title":"...","level":"...","totalDuration":"X months","overview":"2 sentences",' +
        '"phases":[{"phase":"...","duration":"X weeks","skills":["..."],' +
        '"resources":["specific course/book name"],"milestone":"what user can do after this phase"}],' +
        '"tips":["actionable tip 1","tip 2","tip 3"]}. ' +
        'Include 4-5 phases. Resources must be specific and real.',
        [{
          role: 'user',
          content:
            `Generate a detailed career roadmap for: "${careerInput.trim()}". ` +
            `Skill level: ${level}. Return only the JSON object.`,
        }],
        2000
      );
      setGenerated(parseClaudeJSON<GeneratedRoadmap>(raw));
    } catch (err: any) {
      console.log('AI model unavailable, using fallback roadmap');
      // Generate fallback roadmap when AI model fails
      setGenerated(generateFallbackRoadmap(careerInput.trim(), level));
    } finally {
      setLoading(false);
    }
  };

  // Fallback roadmap generator when AI is unavailable
  const generateFallbackRoadmap = (career: string, skillLevel: string): GeneratedRoadmap => {
    const careerLower = career.toLowerCase();
    const duration = skillLevel === 'Beginner' ? '8-10 months' : skillLevel === 'Intermediate' ? '5-7 months' : '3-5 months';
    
    const phases = [
      {
        phase: 'Fundamentals & Core Concepts',
        duration: skillLevel === 'Beginner' ? '4 weeks' : '2 weeks',
        skills: ['Basic Concepts', 'Key Terminology', 'Foundation Principles'],
        resources: [
          'Official Documentation',
          'Online Tutorials',
          'Practice Exercises'
        ],
        milestone: 'Understand core concepts and basic terminology'
      },
      {
        phase: 'Practical Skills Development',
        duration: skillLevel === 'Beginner' ? '8 weeks' : '4 weeks',
        skills: ['Hands-on Practice', 'Tool Usage', 'Basic Projects'],
        resources: [
          'Interactive Courses',
          'Code Exercises',
          'Small Projects'
        ],
        milestone: 'Complete first mini-project independently'
      },
      {
        phase: 'Intermediate Techniques',
        duration: skillLevel === 'Beginner' ? '6 weeks' : '3 weeks',
        skills: ['Advanced Patterns', 'Best Practices', 'Problem Solving'],
        resources: [
          'Advanced Tutorials',
          'Open Source Projects',
          'Coding Challenges'
        ],
        milestone: 'Build a portfolio-ready project'
      },
      {
        phase: 'Advanced Topics & Specialization',
        duration: skillLevel === 'Beginner' ? '8 weeks' : '4 weeks',
        skills: ['Specialization Areas', 'Real-world Applications', 'Advanced Tools'],
        resources: [
          'Specialized Courses',
          'Industry Case Studies',
          'Professional Projects'
        ],
        milestone: 'Demonstrate expertise with advanced projects'
      },
      {
        phase: 'Career Preparation',
        duration: '4 weeks',
        skills: ['Interview Prep', 'Portfolio Building', 'Networking'],
        resources: [
          'Interview Questions',
          'Portfolio Templates',
          'Community Forums'
        ],
        milestone: 'Ready for job applications and interviews'
      }
    ];

    return {
      title: `${career} Learning Path`,
      level: skillLevel,
      totalDuration: duration,
      overview: `A comprehensive learning path to become a ${career}. This roadmap provides structured guidance through essential skills and real-world projects.`,
      phases,
      tips: [
        'Practice coding daily, even if just for 30 minutes',
        'Build projects that solve real problems',
        'Contribute to open source when ready',
        'Network with professionals in the field',
        'Document your learning journey'
      ]
    };
  };

  const clearGenerator = () => {
    setGenerated(null);
    setCareerInput('');
    setError('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.topBar}>
          <Text style={s.screenTitle}>Roadmap</Text>
          {pipelineComplete && (
            <TouchableOpacity 
              style={s.refreshBtn}
              onPress={async () => {
                Alert.alert(
                  'Onboarding Results',
                  null,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Refresh',
                      onPress: async () => {
                        try {
                          const data = await loadOnboarding();
                          if (data && data.pipelineComplete) {
                            useCareerStore.getState().setProfile(data.profile);
                            if (data.enrichedProfile) {
                              useCareerStore.getState().setEnrichedProfile(data.enrichedProfile);
                            }
                            if (data.careerMatches.length > 0) {
                              useCareerStore.getState().setCareerMatches(data.careerMatches);
                            }
                            if (data.roadmap) {
                              useCareerStore.getState().setRoadmap(data.roadmap);
                            }
                            if (data.jobs.length > 0) {
                              useCareerStore.getState().setJobs(data.jobs);
                            }
                            useCareerStore.getState().setPipelineComplete(true);
                            Alert.alert('Success', 'Onboarding results refreshed!');
                          } else {
                            Alert.alert('No Data', 'No onboarding results found on server.');
                          }
                        } catch (error) {
                          Alert.alert('Error', 'Failed to refresh. Please try again.');
                        }
                      }
                    },
                    {
                      text: 'Clear Results',
                      style: 'destructive',
                      onPress: () => {
                        useCareerStore.getState().resetPipeline();
                        Alert.alert('Cleared', 'Onboarding results have been cleared.');
                      }
                    },
                  ]
                );
              }}
            >
              <Text style={s.refreshBtnText}>↻ Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ============================================================
            SECTION 1 — ROADMAP GENERATOR (always visible)
        ============================================================ */}
        <View style={s.generatorCard}>
          <Text style={s.generatorHeading}>🗺  Career Roadmap Generator</Text>
          <Text style={s.generatorSub}>
            Search any career path to get an AI-generated step-by-step learning roadmap.
          </Text>

          {/* Career input */}
          <Text style={s.fieldLabel}>Career Path</Text>
          <TextInput
            style={s.textInput}
            value={careerInput}
            onChangeText={(v) => { setCareerInput(v); setError(''); }}
            placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer"
            placeholderTextColor="#555E6E"
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Skill level selector */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Skill Level</Text>
          <View style={s.levelRow}>
            {SKILL_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[s.levelBtn, level === lvl && s.levelBtnActive]}
                onPress={() => setLevel(lvl)}
                activeOpacity={0.7}
              >
                <Text style={[s.levelBtnText, level === lvl && s.levelBtnTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error */}
          {error !== '' && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠  {error}</Text>
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity
            style={[s.generateBtn, loading && { opacity: 0.6 }]}
            onPress={generateRoadmap}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={s.generateBtnText}>✨  Generate Roadmap</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color="#7F77DD" />
            <Text style={s.loadingTitle}>AI is crafting your roadmap…</Text>
            <Text style={s.loadingSub}>Personalizing phases for {careerInput}</Text>
          </View>
        )}

        {/* Generated roadmap result */}
        {generated && !loading && (
          <View style={s.resultWrap}>
            {/* Result header */}
            <View style={s.resultHeader}>
              <View style={s.badgeRow}>
                <View style={s.levelBadge}>
                  <Text style={s.levelBadgeText}>{generated.level}</Text>
                </View>
                <View style={s.durationBadge}>
                  <Text style={s.durationBadgeText}>⏱  {generated.totalDuration}</Text>
                </View>
              </View>
              <Text style={s.resultTitle}>{generated.title}</Text>
              <Text style={s.resultOverview}>{generated.overview}</Text>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatCell value={String(generated.phases?.length ?? 0)} label="Phases" />
              <View style={s.statDivider} />
              <StatCell value={generated.totalDuration} label="Total time" />
              <View style={s.statDivider} />
              <StatCell value={generated.level} label="Level" />
            </View>

            {/* Phases */}
            <Text style={s.sectionTitle}>Learning Phases</Text>
            <PhaseTimeline
              phases={generated.phases}
              courses={allCourses}
              onOpenCourse={openCourse}
            />

            {/* Tips */}
            {(generated.tips ?? []).length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 20 }]}>Pro Tips</Text>
                <View style={s.tipsCard}>
                  {generated.tips.map((tip, i) => (
                    <View
                      key={i}
                      style={[s.tipRow, i < generated.tips.length - 1 && s.tipBorder]}
                    >
                      <View style={s.tipNum}>
                        <Text style={s.tipNumText}>{i + 1}</Text>
                      </View>
                      <Text style={s.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Clear result */}
            <TouchableOpacity style={s.clearBtn} onPress={clearGenerator} activeOpacity={0.8}>
              <Text style={s.clearBtnText}>Clear & Search Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================
            EMPTY STATE — only shown when Onboarding NOT complete
            (below generator, above YOUR CAREER PLAN divider)
        ============================================================ */}
        {(!pipelineComplete || !roadmap) && (
          <View style={s.emptyOnboardingWrap}>
            <View style={s.dividerWrap}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>YOUR CAREER PLAN</Text>
              <View style={s.dividerLine} />
            </View>
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🗺️</Text>
              <Text style={s.emptyTitle}>No Personalized Roadmap Yet</Text>
              <Text style={s.emptyText}>
                Complete Career Onboarding to get your AI-generated personalized learning roadmap based on your profile.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/onboarding-wrapper')}
              >
                <Text style={s.emptyBtnText}>Start Career Onboarding →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================
            DIVIDER — only shown when Onboarding result exists
        ============================================================ */}
        {pipelineComplete && roadmap && (
          <View style={s.dividerWrap}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>YOUR CAREER PLAN</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* ============================================================
            SECTION 2 — ONBOARDING PIPELINE RESULT
            Shown only when user completed Onboarding
        ============================================================ */}
        {pipelineComplete && roadmap && (
          <View style={s.pipelineWrap}>
            <Text style={s.pipelineNote}>
              Generated from your career profile during onboarding
            </Text>

            {/* Target career + stats */}
            <Text style={s.targetCareer}>{roadmap.targetCareer}</Text>
            <View style={s.statsRow}>
              <StatCell value={String(roadmap.totalMonths)} label="months" />
              <View style={s.statDivider} />
              <StatCell value={String(roadmap.weeklyHours)} label="hrs / week" />
              <View style={s.statDivider} />
              <StatCell value={String((roadmap.phases ?? []).length)} label="phases" />
            </View>

            {/* Phases */}
            <Text style={s.sectionTitle}>Learning Phases</Text>
            <PhaseTimeline
              phases={(roadmap.phases ?? []).map((ph) => ({
                phase: ph.title,
                duration: `${ph.durationWeeks} weeks`,
                skills: ph.skills ?? [],
                resources: ph.resources ?? [],
                milestone: ph.milestone ?? '',
              }))}
              courses={allCourses}
              onOpenCourse={openCourse}
            />

            {/* 90-day plan */}
            {(roadmap.ninetyDayPlan ?? []).length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 20 }]}>90-Day Quick Start</Text>
                <View style={s.tipsCard}>
                  {roadmap.ninetyDayPlan.map((task, i) => (
                    <View
                      key={i}
                      style={[
                        s.tipRow,
                        i < roadmap.ninetyDayPlan.length - 1 && s.tipBorder,
                      ]}
                    >
                      <View style={s.tipNum}>
                        <Text style={s.tipNumText}>{i + 1}</Text>
                      </View>
                      <Text style={s.tipText}>{task}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Spacer at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Phase timeline ─────────────────────────────────────────────────
function PhaseTimeline({
  phases,
  courses = [],
  onOpenCourse,
}: {
  phases: { phase: string; duration: string; skills: string[]; resources: string[]; milestone: string }[];
  courses?: CSVCourse[];
  onOpenCourse?: (url: string) => void;
}) {
  return (
    <>
      {phases.map((phase, idx) => {
        const col = PHASE_COLORS[idx % PHASE_COLORS.length];
        const isLast = idx === phases.length - 1;

        // Get related courses for this phase's skills
        const relatedCourses = onOpenCourse
          ? phase.skills.flatMap(skill =>
              courses
                .filter(c => c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())))
                .slice(0, 1)
            ).filter((c, i, arr) => arr.findIndex(x => x.title === c.title) === i).slice(0, 3)
          : [];

        return (
          <View key={idx} style={tl.row}>
            {/* Left: dot + line */}
            <View style={tl.left}>
              <View style={[tl.dot, { backgroundColor: col }]}>
                <Text style={tl.dotText}>{idx + 1}</Text>
              </View>
              {!isLast && <View style={[tl.line, { backgroundColor: col + '50' }]} />}
            </View>

            {/* Right: card */}
            <View style={[tl.card, { borderLeftColor: col, borderLeftWidth: 2 }]}>
              <View style={tl.cardHeader}>
                <Text style={tl.phaseTitle}>{phase.phase}</Text>
                <View style={[tl.durBadge, { backgroundColor: col + '25' }]}>
                  <Text style={[tl.durText, { color: col }]}>{phase.duration}</Text>
                </View>
              </View>

              {/* Skills */}
              {(phase.skills ?? []).length > 0 && (
                <>
                  <Text style={tl.subLabel}>SKILLS</Text>
                  <View style={tl.tagsRow}>
                    {phase.skills.map((sk) => (
                      <View key={sk} style={[tl.tag, { borderColor: col + '60' }]}>
                        <Text style={[tl.tagText, { color: col }]}>{sk}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Resources */}
              {(phase.resources ?? []).length > 0 && (
                <>
                  <Text style={tl.subLabel}>RESOURCES</Text>
                  {phase.resources.map((res, ri) => (
                    <View key={ri} style={tl.resRow}>
                      <View style={[tl.resDot, { backgroundColor: col }]} />
                      <Text style={tl.resText}>{res}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Milestone */}
              {phase.milestone ? (
                <View style={[tl.milestone, { backgroundColor: col + '20' }]}>
                  <Text style={[tl.milestoneText, { color: col }]}>
                    🎯  {phase.milestone}
                  </Text>
                </View>
              ) : null}

              {/* Related Courses */}
              {relatedCourses.length > 0 && onOpenCourse && (
                <RelatedCourses courses={relatedCourses} phaseColor={col} onOpenCourse={onOpenCourse} />
              )}
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── Stat cell ──────────────────────────────────────────────────────
function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statCell}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Related courses component ─────────────────────────────────────
function RelatedCourses({
  courses,
  phaseColor,
  onOpenCourse,
}: {
  courses: CSVCourse[];
  phaseColor: string;
  onOpenCourse: (url: string) => void;
}) {
  if (courses.length === 0) return null;

  return (
    <View style={tl.coursesSection}>
      <Text style={tl.subLabel}>📚 RELATED COURSES</Text>
      {courses.map((course, idx) => (
        <TouchableOpacity
          key={idx}
          style={tl.courseRow}
          onPress={() => onOpenCourse(course.url)}
          activeOpacity={0.7}
        >
          <View style={[tl.courseDot, { backgroundColor: phaseColor }]} />
          <View style={tl.courseInfo}>
            <Text style={tl.courseTitle} numberOfLines={1}>{course.title}</Text>
            <Text style={tl.coursePlatform}>{course.platform}</Text>
          </View>
          <Text style={tl.courseArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ================================================================
// Styles
// ================================================================
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F1724' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },

  // Top bar
  topBar: { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  refreshBtn: { backgroundColor: '#1A2535', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 0.5, borderColor: '#2A3A50' },
  refreshBtnText: { color: '#d4a45f', fontSize: 13, fontWeight: '600' },

  // Generator card
  generatorCard: { backgroundColor: '#1A2535', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 0.5, borderColor: '#2A3A50' },
  generatorHeading: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  generatorSub: { fontSize: 12, color: '#888780', lineHeight: 18, marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#AFA9EC', fontWeight: '500', marginBottom: 8 },
  textInput: { backgroundColor: '#0F1724', borderWidth: 0.5, borderColor: '#2A3A50', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#FFFFFF' },

  // Level row
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#2A3A50', backgroundColor: '#0F1724', alignItems: 'center' },
  levelBtnActive: { backgroundColor: '#2D2A5E', borderColor: '#7F77DD' },
  levelBtnText: { fontSize: 13, color: '#888780', fontWeight: '500' },
  levelBtnTextActive: { color: '#AFA9EC' },

  // Error
  errorBox: { backgroundColor: '#2A1515', borderRadius: 8, borderWidth: 0.5, borderColor: '#A32D2D', padding: 10, marginTop: 10 },
  errorText: { fontSize: 12, color: '#F09595' },

  // Generate button
  generateBtn: { backgroundColor: '#534AB7', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  generateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Loading card
  loadingCard: { backgroundColor: '#1A2535', borderRadius: 14, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 0.5, borderColor: '#2A3A50' },
  loadingTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 4 },
  loadingSub: { color: '#888780', fontSize: 12, textAlign: 'center' },

  // Result
  resultWrap: { marginBottom: 8 },
  resultHeader: { backgroundColor: '#1A2535', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: '#2A3A50' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  levelBadge: { backgroundColor: '#2D2A5E', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 12 },
  levelBadgeText: { fontSize: 11, color: '#AFA9EC', fontWeight: '600' },
  durationBadge: { backgroundColor: '#1E3A20', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 12 },
  durationBadgeText: { fontSize: 11, color: '#3B6D11', fontWeight: '600' },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  resultOverview: { fontSize: 12, color: '#888780', lineHeight: 18 },

  // Stats row
  statsRow: { flexDirection: 'row', backgroundColor: '#1A2535', borderRadius: 12, borderWidth: 0.5, borderColor: '#2A3A50', padding: 14, marginBottom: 18, alignItems: 'center', justifyContent: 'space-around' },
  statCell: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 16, fontWeight: '700', color: '#7F77DD', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888780' },
  statDivider: { width: 1, height: 28, backgroundColor: '#2A3A50' },

  // Section title
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },

  // Tips / 90-day plan card
  tipsCard: { backgroundColor: '#1A2535', borderRadius: 12, borderWidth: 0.5, borderColor: '#2A3A50', overflow: 'hidden', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  tipBorder: { borderBottomWidth: 0.5, borderBottomColor: '#2A3A50' },
  tipNum: { width: 20, height: 20, borderRadius: 99, backgroundColor: '#2D2A5E', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  tipNumText: { color: '#7F77DD', fontSize: 10, fontWeight: '700' },
  tipText: { fontSize: 12, color: '#888780', flex: 1, lineHeight: 18 },

  // Clear button
  clearBtn: { backgroundColor: '#1A2535', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#2A3A50', marginBottom: 8 },
  clearBtnText: { color: '#7F77DD', fontSize: 13, fontWeight: '600' },

  // Divider between generator and onboarding result
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 24 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#2A3A50' },
  dividerLabel: { fontSize: 11, color: '#888780', fontWeight: '600', letterSpacing: 1 },

  // Onboarding pipeline section
  pipelineWrap: {},
  pipelineNote: { fontSize: 12, color: '#534AB7', fontWeight: '500', marginBottom: 8 },
  targetCareer: { fontSize: 15, color: '#7F77DD', fontWeight: '600', marginBottom: 14 },

  // Empty onboarding state (below generator)
  emptyOnboardingWrap: { marginTop: 8 },
  emptyCard: { backgroundColor: '#1A2535', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: '#2A3A50' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#888780', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#534AB7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

// ── Phase timeline styles ──────────────────────────────────────────
const tl = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 6 },
  left: { alignItems: 'center', width: 32, marginRight: 10 },
  dot: { width: 30, height: 30, borderRadius: 99, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  line: { width: 2, flex: 1, marginTop: 4, marginBottom: -6 },
  card: { flex: 1, backgroundColor: '#1A2535', borderRadius: 12, borderWidth: 0.5, borderColor: '#2A3A50', padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  phaseTitle: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  durBadge: { borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  durText: { fontSize: 10, fontWeight: '600' },
  subLabel: { fontSize: 10, color: '#555E6E', fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  tag: { borderWidth: 0.5, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { fontSize: 11, fontWeight: '500' },
  resRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 },
  resDot: { width: 5, height: 5, borderRadius: 99, marginTop: 6, flexShrink: 0 },
  resText: { fontSize: 11, color: '#888780', flex: 1, lineHeight: 17 },
  milestone: { borderRadius: 8, padding: 9, marginTop: 8 },
  milestoneText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  // Related courses styles
  coursesSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  courseDot: { width: 6, height: 6, borderRadius: 99, flexShrink: 0 },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 11, color: '#d4a45f', fontWeight: '500' },
  coursePlatform: { fontSize: 10, color: '#888780' },
  courseArrow: { fontSize: 12, color: '#7F77DD' },
});