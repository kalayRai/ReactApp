// app/(tabs)/jobs.tsx — AI-matched job board
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { useCareerStore } from '../../src/store/careerStore';
import { JobMatch } from '../../src/types';
import { loadOnboarding } from '../../services/auth';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const WHITE = '#ffffff';
const CARD_BG = 'rgba(255,255,255,0.06)';

type F = 'All' | 'Ready now' | 'Stretch' | 'Future goal';
const FILTERS: F[] = ['All', 'Ready now', 'Stretch', 'Future goal'];

const RL: Record<string, { bg: string; fg: string }> = {
  'Ready now':  { bg: 'rgba(5,150,105,0.15)', fg: '#34D399' },
  'Stretch':    { bg: 'rgba(217,119,6,0.15)', fg: '#FCD34D' },
  'Future goal':{ bg: 'rgba(212,164,95,0.15)', fg: '#d4a45f' },
};

export default function JobsScreen() {
  const { jobs, pipelineComplete } = useCareerStore();
  const [filter, setFilter] = useState<F>('All');
  const data = filter === 'All' ? jobs : jobs.filter((j: JobMatch) => j.readinessLevel === filter);

  if (!pipelineComplete || jobs.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jobs</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💼</Text>
          <Text style={styles.emptyText}>Complete onboarding to see AI-matched job listings.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
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
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, filter === f && styles.pillOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs match this filter.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function JobCard({ job }: { job: JobMatch }) {
  const r = RL[job.readinessLevel] ?? RL['Stretch'];
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{job.company.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.score}>{job.matchScore}</Text>
          <Text style={styles.scoreSub}>%</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>📍 {job.location}</Text>
        <Text style={styles.metaText}>💰 {job.salaryRange}</Text>
      </View>
      <View style={styles.tags}>
        <View style={[styles.rlTag, { backgroundColor: r.bg }]}>
          <Text style={[styles.rlTagText, { color: r.fg }]}>{job.readinessLevel}</Text>
        </View>
        {(job.skills ?? []).slice(0, 3).map(sk => (
          <View key={sk} style={styles.skillTag}>
            <Text style={styles.skillText}>{sk}</Text>
          </View>
        ))}
      </View>
      {(job.matchReasons ?? []).length > 0 && (
        <Text style={styles.reasons} numberOfLines={2}>
          {job.matchReasons.join('  ·  ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WHITE,
  },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  refreshBtnText: { color: BRAND_GOLD, fontSize: 12, fontWeight: '600' },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillOn: {
    backgroundColor: 'rgba(212,164,95,0.2)',
    borderColor: BRAND_GOLD,
  },
  pillText: {
    fontSize: 13,
    color: '#888',
  },
  pillTextOn: {
    color: BRAND_GOLD,
    fontWeight: '600',
  },
  list: {
    padding: 18,
    gap: 14,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212,164,95,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  logoText: {
    fontSize: 14,
    color: BRAND_GOLD,
    fontWeight: 'bold',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 13,
    color: '#888',
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BRAND_GOLD,
    lineHeight: 32,
  },
  scoreSub: {
    fontSize: 11,
    color: '#666',
  },
  meta: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  rlTag: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  rlTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  skillTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  skillText: {
    fontSize: 11,
    color: '#888',
  },
  reasons: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});