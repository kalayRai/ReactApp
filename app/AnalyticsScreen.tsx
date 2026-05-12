import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated, RefreshControl,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { CareerMatch } from '../src/types/index';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useAuth } from '../context/AuthContext';
import { fetchAnalyticsTrends, getFallbackData, exportAnalytics } from '../services/Analytic_service';
import { loadOnboarding } from '../services/auth';
import { TrendsData, UserProgress, RoleData, EmergingSkill } from '../src/types/analyticsTypes';
import StatCard from '../components/analytics/statCard';
import TrendCard from '../components/analytics/trendCards';
import { SkillProgressList } from '../components/analytics/skillProgressBar';
import SkillDemandChart from '../components/analytics/skillDemandChart';

interface AnalyticsScreenProps {
  onLogout?: () => void;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onLogout }) => {
  const router = useRouter();
  const { token, isAuthenticated, user, logout } = useAuth();
  const {
    profile, enrichedProfile, careerMatches,
    jobs, pipelineComplete,
  } = useCareerStore();

  const [data, setData] = useState<TrendsData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      if (isAuthenticated && token) {
        const result = await fetchAnalyticsTrends(token);
        setData(result);
      } else {
        setData(getFallbackData());
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      if (!isAuthenticated) {
        setData(getFallbackData());
      } else {
        setError('Unable to load analytics. Please check your connection.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadAnalytics(true);
  }, []);

  const handleExport = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to export analytics data.');
      return;
    }

    try {
      await exportAnalytics(token, 'csv');
      Alert.alert('Success', 'Analytics exported successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to export analytics.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  // Stats data derived from API response
  const getStatsData = () => {
    if (!data?.user_progress) {
      return [
        { icon: '🎓', value: 0, label: 'Courses Completed' },
        { icon: '📈', value: 0, label: 'Avg Interview Score' },
        { icon: '🔥', value: 0, label: 'Trending Skills' },
        { icon: '🏆', value: 0, label: 'Quizzes Taken' },
      ];
    }
    const up = data.user_progress;
    return [
      { icon: '🎓', value: up.total_courses_completed || 0, label: 'Courses Completed' },
      { icon: '📈', value: `${up.average_interview_score || 0}%`, label: 'Avg Interview Score' },
      { icon: '🔥', value: data.trends?.trending_skills?.length || 0, label: 'Trending Skills' },
      { icon: '🏆', value: up.quiz_completions || 0, label: 'Quizzes Taken' },
    ];
  };

  const getTrendingSkills = () => {
    return (data?.trends?.trending_skills || ['Python', 'AI', 'Data Science', 'Cloud', 'DevOps']).map(skill => ({
      name: skill,
      growth: 'Trending',
    }));
  };

  const getInDemandRoles = (): RoleData[] => {
    if (data?.job_market?.top_in_demand_roles) {
      return data.job_market.top_in_demand_roles;
    }
    return [
      { role: 'Data Scientist', demand_growth: '+45%', avg_salary: '$120,000' },
      { role: 'AI Engineer', demand_growth: '+60%', avg_salary: '$135,000' },
      { role: 'Full Stack Developer', demand_growth: '+30%', avg_salary: '$110,000' },
      { role: 'DevOps Engineer', demand_growth: '+40%', avg_salary: '$125,000' },
    ];
  };

  const getEmergingSkills = (): EmergingSkill[] => {
    if (data?.job_market?.emerging_skills) {
      return data.job_market.emerging_skills;
    }
    return [
      { skill: 'Prompt Engineering', growth: '+200%' },
      { skill: 'RAG Systems', growth: '+150%' },
      { skill: 'MLOps', growth: '+120%' },
      { skill: 'LangChain', growth: '+100%' },
    ];
  };

  const getSkillProgress = () => {
    return data?.user_progress?.skill_progress || {
      'Python': 75,
      'Data Analysis': 60,
      'Machine Learning': 45,
      'Web Development': 30,
      'Cloud Computing': 20,
    };
  };

  const hasOnboardingData = pipelineComplete && careerMatches.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#d4a45f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <View style={{ width: 40 }} />
        {pipelineComplete && (
          <TouchableOpacity 
            style={styles.refreshBtn}
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
            <Ionicons name="refresh" size={20} color="#d4a45f" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d4a45f"
            colors={['#d4a45f']}
          />
        }
      >
        {/* Onboarding Results Section */}
        {hasOnboardingData ? (
          <>
            <Text style={styles.greeting}>
              {profile.name ? `${profile.name}'s Career Analysis` : 'Your Career Analysis'}
            </Text>
            <Text style={styles.greetingSub}>
              AI-generated based on your profile · {careerMatches.length} matches found
            </Text>

            {/* Career DNA card */}
            {enrichedProfile && (
              <View style={styles.dnaCard}>
                <Text style={styles.dnaLabel}>YOUR CAREER DNA</Text>
                <Text style={styles.dnaText}>
                  {[
                    ...(enrichedProfile.careerDNA.strengths ?? []).slice(0, 2),
                    ...(enrichedProfile.careerDNA.motivators ?? []).slice(0, 2),
                  ].join('  ·  ')}
                </Text>
                <View style={styles.archetypeRow}>
                  {(enrichedProfile.candidateArchetypes ?? []).slice(0, 2).map((a) => (
                    <View key={a} style={styles.archetypePill}>
                      <Text style={styles.archetypeText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard value={String(careerMatches[0]?.fitScore ?? 0) + '%'} label="Top Fit Score" icon={''} />
              <StatCard value={`$${careerMatches[0]?.salaryMin ?? 0}k`} label="Min Salary" icon={''} />
              <StatCard value={String(jobs.length)} label="Jobs Found" icon={''} />
            </View>

            {/* Career match cards */}
            <Text style={styles.sectionTitle}>Career Matches</Text>
            {careerMatches.slice(0, 4).map((match, idx) => (
              <CareerCard key={match.careerId} match={match} isTop={idx === 0} />
            ))}

            {/* Jobs preview */}
            {jobs.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Matched Jobs</Text>
                {jobs.slice(0, 3).map((job, idx) => (
                  <View key={idx} style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <View style={styles.jobLogo}>
                        <Text style={styles.jobLogoText}>{job.company.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
                      </View>
                      <Text style={styles.jobScore}>{job.matchScore}%</Text>
                    </View>
                    <View style={styles.jobFooter}>
                      <Text style={styles.jobSalary}>{job.salaryRange}</Text>
                      <View style={[
                        styles.readinessPill,
                        job.readinessLevel === 'Ready now' && { backgroundColor: '#1E3A20' },
                        job.readinessLevel === 'Stretch' && { backgroundColor: '#2A2010' },
                        job.readinessLevel === 'Future goal' && { backgroundColor: '#2D2A5E' },
                      ]}>
                        <Text style={[
                          styles.readinessText,
                          job.readinessLevel === 'Ready now' && { color: '#3B6D11' },
                          job.readinessLevel === 'Stretch' && { color: '#854F0B' },
                          job.readinessLevel === 'Future goal' && { color: '#7F77DD' },
                        ]}>
                          {job.readinessLevel}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* CTA to roadmap */}
            <TouchableOpacity
              style={styles.roadmapCta}
              onPress={() => router.push('/(tabs)/roadmap')}
            >
              <Text style={styles.roadmapCtaText}>View Full Learning Roadmap →</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Empty state - show when onboarding not complete */
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyText}>
              Complete the Career Onboarding to generate your personalized career analysis.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/onboarding-wrapper')}
            >
              <Text style={styles.emptyBtnText}>Start Career Onboarding →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Career Analytics Dashboard - Always shown below */}
        <View style={styles.analyticsSection}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Career Analytics Dashboard</Text>
            <Text style={styles.subtitle}>Track career trends, market insights, and your learning progress</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {getStatsData().map((stat, index) => (
              <View key={index} style={styles.statCardWrapper}>
                <StatCard icon={stat.icon} value={stat.value} label={stat.label} />
              </View>
            ))}
          </View>

          {/* Dashboard Cards Row 1 */}
          <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
              <TrendCard
                title="Trending Skills"
                icon="🔥"
                items={getTrendingSkills()}
                type="skill"
              />
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
              <TrendCard
                title="In-Demand Roles"
                icon="📢"
                items={getInDemandRoles().map(r => ({ ...r, name: r.role, growth: r.demand_growth }))}
                type="role"
              />
            </View>
          </View>

          {/* Your Skill Progress */}
          <View style={styles.progressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📉</Text>
              <Text style={styles.cardTitle}>Your Skill Progress</Text>
            </View>
            <SkillProgressList skills={getSkillProgress()} />
          </View>

          {/* Emerging Skills */}
          <TrendCard
            title="Emerging Skills"
            icon="🚀"
            items={getEmergingSkills().map(s => ({ ...s, name: s.skill }))}
            type="skill"
          />

          {/* Chart Section */}
          <SkillDemandChart />

          {/* Export Button */}
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.exportIcon}>📥</Text>
            <Text style={styles.exportText}>Export Analytics (CSV)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Career Card with animated bars ───────────────────────────────
function CareerCard({ match, isTop }: { match: CareerMatch; isTop: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 900, delay: 200, useNativeDriver: false,
    }).start();
  }, []);

  const bars = [
    { label: 'Overall Fit', value: match.fitScore },
    { label: 'Skill Match', value: match.skillFit },
    { label: 'Interest Fit', value: match.interestFit },
  ];

  return (
    <View style={[styles.careerCard, isTop && styles.careerCardTop]}>
      {isTop && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>🏆 Top Match</Text>
        </View>
      )}
      <Text style={styles.careerTitle}>{match.title}</Text>
      <Text style={styles.careerCategory}>{match.category}</Text>

      {bars.map(({ label, value }) => (
        <View key={label} style={styles.barWrap}>
          <View style={styles.barMeta}>
            <Text style={styles.barLabel}>{label}</Text>
            <Text style={styles.barValue}>{value}%</Text>
          </View>
          <View style={styles.barTrack}>
            <Animated.View style={[
              styles.barFill,
              { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${value}%`] }) },
            ]} />
          </View>
        </View>
      ))}

      <View style={styles.careerFooter}>
        <Text style={styles.salary}>
          ${match.salaryMin}k – ${match.salaryMax}k / yr
        </Text>
        <Text style={styles.growthScore}>↑ {match.growthScore}% growth</Text>
      </View>

      {match.reasoning ? (
        <Text style={styles.reasoning} numberOfLines={2}>{match.reasoning}</Text>
      ) : null}
    </View>
  );
}

// ── Styles — dark navy matching your app ─────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#081833',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12 + (Platform.OS === 'android' ? 25 : 0),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10264a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f365f',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginLeft: 14,
  },

  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 48,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 13,
    color: '#888780',
    marginBottom: 20,
  },
  dnaCard: {
    backgroundColor: '#2D2A5E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#7F77DD',
  },
  dnaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AFA9EC',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  dnaText: {
    fontSize: 13,
    color: '#EEEDFE',
    lineHeight: 20,
    marginBottom: 10,
  },
  archetypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  archetypePill: {
    backgroundColor: '#534AB7',
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  archetypeText: {
    fontSize: 11,
    color: '#EEEDFE',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  careerCard: {
    backgroundColor: '#1A2535',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#2A3A50',
    padding: 16,
    marginBottom: 12,
  },
  careerCardTop: {
    borderColor: '#7F77DD',
    borderWidth: 1.5,
  },
  topBadge: {
    backgroundColor: '#2D2A5E',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginBottom: 10,
  },
  topBadgeText: {
    fontSize: 11,
    color: '#AFA9EC',
    fontWeight: '600',
  },
  careerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  careerCategory: {
    fontSize: 12,
    color: '#888780',
    marginBottom: 14,
  },
  barWrap: {
    marginBottom: 10,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#888780',
  },
  barValue: {
    fontSize: 11,
    color: '#7F77DD',
    fontWeight: '500',
  },
  barTrack: {
    height: 4,
    backgroundColor: '#0F1724',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#534AB7',
    borderRadius: 99,
  },
  careerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  salary: {
    fontSize: 12,
    color: '#888780',
  },
  growthScore: {
    fontSize: 12,
    color: '#3B6D11',
  },
  reasoning: {
    fontSize: 12,
    color: '#888780',
    marginTop: 8,
    lineHeight: 18,
  },
  jobCard: {
    backgroundColor: '#1A2535',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#2A3A50',
    padding: 14,
    marginBottom: 10,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  jobLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2D2A5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogoText: {
    fontSize: 12,
    color: '#7F77DD',
    fontWeight: '700',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 11,
    color: '#888780',
  },
  jobScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7F77DD',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobSalary: {
    fontSize: 12,
    color: '#888780',
  },
  readinessPill: {
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  readinessText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roadmapCta: {
    backgroundColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  roadmapCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888780',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#d4a45f',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  emptyBtnText: {
    color: '#0a0101',
    fontWeight: '600',
    fontSize: 14,
  },

  // Analytics Dashboard styles
  analyticsSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHalf: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4a45f',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4a45f',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  exportIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  exportText: {
    color: '#081833',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsScreen;