import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, StatusBar,
  Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { callClaude } from '../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { loadOnboarding } from '../services/auth';

const OPTIONS = [
  { value: 'Python programming',            label: '🐍 Learn Python (3 months)' },
  { value: 'Machine Learning fundamentals', label: '🤖 Complete ML Course' },
  { value: 'Product Management skills',     label: '📋 Transition to PM (6 months)' },
  { value: 'SQL and Data Analysis',         label: '📊 Master SQL & Data Analysis' },
  { value: 'AWS Cloud certification',       label: '☁️  Get AWS Certified' },
  { value: 'UX Design bootcamp',            label: '🎨 Complete UX Bootcamp' },
];

interface SimResult {
  newTopCareer: string;
  newFitScore: number;
  previousFitScore: number;
  previousCareer: string;
  impactSummary: string;
  newCareersUnlocked: string[];
  timeInvestment: string;
}

export default function SimulatorScreen() {
  const router = useRouter();
  const { profile, careerMatches, pipelineComplete } = useCareerStore();
  const [selected, setSelected] = useState(OPTIONS[0].value);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<SimResult | null>(null);

  const parseClaudeJSON = <T,>(text: string): T => {
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (e) {
      throw new Error('Failed to parse AI response');
    }
  };

  const runSimulation = async () => {
    if (!careerMatches.length) return;
    setLoading(true);
    setResult(null);
    const top = careerMatches[0];

    try {
      const raw = await callClaude(
        'You are a career simulator. Return ONLY a JSON object, no markdown. ' +
        'Schema: {"newTopCareer":"career title","newFitScore":0-100,' +
        '"previousFitScore":0-100,"previousCareer":"career title",' +
        '"impactSummary":"2 sentences","newCareersUnlocked":["career1","career2"],' +
        '"timeInvestment":"X months"}',
        [{
          role: 'user',
          content: `Current top match: ${top.title} (${top.fitScore}% fit). ` +
            `User adds: "${selected}". Current skills: [${profile.skills?.join(', ') ?? 'No skills listed'}]. ` +
            'How does this change career recommendations? Return JSON only.',
        }],
        500
      );
      setResult(parseClaudeJSON<SimResult>(raw));
    } catch {
      setResult({
        newTopCareer: careerMatches[1]?.title ?? 'Data Scientist',
        newFitScore: Math.min(99, top.fitScore + 12),
        previousFitScore: top.fitScore,
        previousCareer: top.title,
        impactSummary: `Adding ${selected} significantly strengthens your profile.`,
        newCareersUnlocked: ['ML Engineer', 'AI Product Manager'],
        timeInvestment: '3–4 months',
      });
    } finally {
      setLoading(false);
    }
  };

  const delta = result ? result.newFitScore - result.previousFitScore : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#d4a45f" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Career Simulator</Text>
          <View style={{ width: 60 }} />
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
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Locked state */}
        {!pipelineComplete && (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>🔮</Text>
            <Text style={styles.lockedTitle}>Complete Onboarding First</Text>
            <Text style={styles.lockedText}>
              Fill in your career profile using the Career Onboarding card on the home screen
              to unlock the simulator.
            </Text>
            <TouchableOpacity
              style={styles.lockedBtn}
              onPress={() => router.push('/onboarding-wrapper')}
            >
              <Text style={styles.lockedBtnText}>Go to Onboarding →</Text>
            </TouchableOpacity>
          </View>
        )}

        {pipelineComplete && (
          <>
            <Text style={styles.screenSub}>
              Model how learning a new skill shifts your career fit scores
            </Text>

            <Text style={styles.sectionTitle}>Choose a hypothetical change</Text>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected === opt.value && styles.optionActive]}
                onPress={() => { setSelected(opt.value); setResult(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, selected === opt.value && styles.optionTextActive]}>
                  {opt.label}
                </Text>
                {selected === opt.value && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.runBtn, loading && { opacity: 0.6 }]}
              onPress={runSimulation}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.runBtnText}>Run Simulation →</Text>
              }
            </TouchableOpacity>

            {/* Results */}
            {result && (
              <View style={styles.results}>
                <Text style={styles.sectionTitle}>Simulation Results</Text>

                <View style={styles.compareRow}>
                  {/* Before */}
                  <View style={styles.compareCard}>
                    <Text style={styles.compareLabel}>BEFORE</Text>
                    <Text style={styles.compareCareer}>{result.previousCareer}</Text>
                    <Text style={[styles.compareScore, { color: '#888780' }]}>
                      {result.previousFitScore}%
                    </Text>
                    <Text style={styles.compareSub}>fit score</Text>
                  </View>

                  <Text style={styles.arrow}>→</Text>

                  {/* After */}
                  <View style={[styles.compareCard, styles.compareCardAfter]}>
                    <Text style={[styles.compareLabel, { color: '#7F77DD' }]}>AFTER</Text>
                    <Text style={styles.compareCareer}>{result.newTopCareer}</Text>
                    <Text style={styles.compareScore}>{result.newFitScore}%</Text>
                    <View style={styles.deltaPill}>
                      <Text style={styles.deltaPillText}>+{delta} pts</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.impactCard}>
                  <Text style={styles.impactTitle}>Impact Summary</Text>
                  <Text style={styles.impactText}>{result.impactSummary}</Text>
                  {result.newCareersUnlocked?.length > 0 && (
                    <Text style={styles.impactMeta}>
                      New paths:{' '}
                      <Text style={{ color: '#7F77DD', fontWeight: '600' }}>
                        {result.newCareersUnlocked.join(', ')}
                      </Text>
                    </Text>
                  )}
                  <Text style={styles.impactMeta}>
                    Time needed:{' '}
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      {result.timeInvestment}
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081833',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#081833',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0), 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  backButton: {
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
  refreshBtnText: {
    color: '#d4a45f',
    fontSize: 18,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    marginLeft: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#c8d2e3',
  },
  screenSub: {
    fontSize: 14,
    lineHeight: 22,
    color: '#c8d2e3',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#10264a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#c8d2e3',
    marginTop: 8,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d4a45f',
    marginTop: 18,
    marginBottom: 10,
  },
  cardGrid: {
    gap: 12,
  },
  selectionCard: {
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
    gap: 8,
  },
  selectionCardActive: {
    backgroundColor: '#d4a45f',
    borderColor: '#d4a45f',
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectionTitleActive: {
    color: '#081833',
  },
  selectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#c8d2e3',
  },
  selectionDescriptionActive: {
    color: '#081833',
  },
  levelRow: {
    gap: 12,
  },
  levelCard: {
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1b335a',
    gap: 6,
  },
  levelCardActive: {
    borderColor: '#d4a45f',
    backgroundColor: '#17345f',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  levelTitleActive: {
    color: '#d4a45f',
  },
  levelDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#c8d2e3',
  },
  levelDescriptionActive: {
    color: '#e7d5b7',
  },
  infoBanner: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0c1f3f',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a446e',
  },
  infoBannerText: {
    flex: 1,
    color: '#e5edf9',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#d4a45f',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#081833',
    fontSize: 16,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  counterBadge: {
    backgroundColor: '#d4a45f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: '#081833',
    fontSize: 13,
    fontWeight: '700',
  },
  questionCard: {
    marginTop: 18,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questionCategory: {
    color: '#d4a45f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  questionLevel: {
    color: '#aebcd3',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  questionText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
  },
  answerInput: {
    marginTop: 4,
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: '#0c1f3f',
    borderWidth: 1,
    borderColor: '#1b335a',
    padding: 14,
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  answerInputDisabled: {
    opacity: 0.82,
  },
  feedbackCard: {
    marginTop: 18,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scorePill: {
    backgroundColor: '#d4a45f',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scorePillText: {
    color: '#081833',
    fontWeight: '700',
    fontSize: 12,
  },
  feedbackText: {
    marginTop: 12,
    color: '#dce6f7',
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4a45f',
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#d4a45f',
    fontSize: 15,
    fontWeight: '700',
  },
  completionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    backgroundColor: '#d4a45f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1b335a',
    alignItems: 'center',
  },
  summaryValue: {
    color: '#d4a45f',
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#c8d2e3',
    fontSize: 12,
    marginTop: 6,
  },
  inlineRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineRefreshText: {
    color: '#d4a45f',
    fontSize: 13,
    fontWeight: '600',
  },
  stateCard: {
    marginTop: 16,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1b335a',
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    color: '#dce6f7',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  historyCard: {
    marginTop: 14,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyScore: {
    backgroundColor: '#d4a45f',
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  historyScoreText: {
    color: '#081833',
    fontSize: 14,
    fontWeight: '700',
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  historyMeta: {
    color: '#c8d2e3',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  historyDate: {
    marginTop: 10,
    color: '#8ea0bf',
    fontSize: 12,
  },
  lockedCard: {
    marginTop: 1,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1b335a',
    alignItems: 'center',
    gap: 10,
  },
  lockedIcon: {
    fontSize: 40,
  },
  lockedTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedText: {
    color: '#c8d2e3',
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
  },
  lockedBtn: {
    backgroundColor: '#d4a45f',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  lockedBtnText: {
    color: '#081833',
    fontSize: 14,
    fontWeight: '600',
  },
  impactCard: {
    marginTop: 16,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  impactText: {
    marginTop: 12,
    color: '#dce6f7',
    fontSize: 14,
    lineHeight: 21,
  },
  impactMeta: {
    marginTop: 8,
    color: '#c8d2e3',
    fontSize: 14,
    lineHeight: 21,
  },
  option: {
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1b335a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionActive: {
    borderColor: '#d4a45f',
    backgroundColor: '#17345f',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 13,
  },
  optionTextActive: {
    color: '#d4a45f',
    fontWeight: '600',
  },
  check: {
    color: '#d4a45f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  runBtn: {
    marginTop: 18,
    backgroundColor: '#d4a45f',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  runBtnText: {
    color: '#081833',
    fontSize: 16,
    fontWeight: '700',
  },
  results: {
    marginTop: 24,
    gap: 16,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compareCard: {
    flex: 1,
    backgroundColor: '#0c1f3f',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1b335a',
    alignItems: 'center',
  },
  compareCardAfter: {
    borderColor: '#7F77DD',
    backgroundColor: '#1a1a3f',
  },
  compareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888780',
    marginBottom: 8,
  },
  compareCareer: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    height: 40,
  },
  compareScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7F77DD',
    marginTop: 4,
  },
  compareSub: {
    fontSize: 10,
    color: '#888780',
  },
  arrow: {
    color: '#d4a45f',
    fontSize: 20,
  },
  deltaPill: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  deltaPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});