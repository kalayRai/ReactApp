import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.1)';
const CARD_BG_HOVER = 'rgba(255,255,255,0.15)';
const ERROR_RED = '#ff6b6b';

type ProgressData = {
  completed_courses?: string[];
  saved_roadmaps?: string[];
};

type UserProfile = {
  name?: string;
  email?: string;
  created_at?: string;
  last_login?: string | null;
  progress?: ProgressData;
};

type PlatformStats = {
  total_users?: number;
  total_course_reviews?: number;
  total_courses?: number;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString();
};

const formatNumber = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  return value.toLocaleString();
};

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoLabelRow}>
        <Ionicons name={icon} size={16} color={BRAND_GOLD} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ProgressCard({
  icon,
  title,
  items,
  emptyText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.sectionHeadingRow}>
        <Ionicons name={icon} size={18} color={BRAND_GOLD} />
        <Text style={styles.progressTitle}>{title}</Text>
      </View>

      {items.length ? (
        <View style={styles.badgeWrap}>
          {items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.badge}>
              <Text style={styles.badgeText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={22} color={BRAND_GOLD} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const completedCourses = useMemo(
    () => profile?.progress?.completed_courses ?? [],
    [profile]
  );

  const savedRoadmaps = useMemo(
    () => profile?.progress?.saved_roadmaps ?? [],
    [profile]
  );

  const loadProfileData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setScreenLoading(true);
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const [profileResponse, statsResponse] = await Promise.all([
        api.get('/api/user/profile'),
        api.get('/api/stats'),
      ]);

      setProfile(profileResponse.data ?? {});
      setStats(statsResponse.data ?? {});
      setSuccessMessage('Profile loaded successfully.');
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Error loading profile. Please try again.');
      setProfile(null);
      setStats(null);
    } finally {
      setScreenLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    loadProfileData();
  }, [authLoading, loadProfileData, user]);

  const handleRefresh = () => {
    if (!user) return;
    loadProfileData(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authLoading || (screenLoading && !profile && !stats)) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
          <Text style={styles.stateText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
          <Text style={styles.stateText}>Redirecting to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND_GOLD} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>👤 My Profile</Text>
            <Text style={styles.subtitle}>Track your personal details and learning journey.</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#9ef0b4" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={ERROR_RED} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="id-card-outline" size={20} color={BRAND_GOLD} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoGrid}>
            <InfoCard
              icon="person-outline"
              label="Name"
              value={profile?.name || user.name || 'N/A'}
            />
            <InfoCard
              icon="mail-outline"
              label="Email"
              value={profile?.email || user.email || 'N/A'}
            />
            <InfoCard
              icon="calendar-outline"
              label="Member Since"
              value={formatDate(profile?.created_at)}
            />
            <InfoCard
              icon="time-outline"
              label="Last Login"
              value={formatDate(profile?.last_login)}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="school-outline" size={20} color={BRAND_GOLD} />
            <Text style={styles.sectionTitle}>Learning Progress</Text>
          </View>

          <View style={styles.progressGrid}>
            <ProgressCard
              icon="checkmark-circle-outline"
              title="Completed Courses"
              items={completedCourses}
              emptyText="No courses completed yet."
            />
            <ProgressCard
              icon="map-outline"
              title="Saved Roadmaps"
              items={savedRoadmaps}
              emptyText="No roadmaps saved yet."
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="stats-chart-outline" size={20} color={BRAND_GOLD} />
            <Text style={styles.sectionTitle}>Platform Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon="people-outline"
              label="Total Users"
              value={formatNumber(stats?.total_users)}
            />
            <StatCard
              icon="star-outline"
              label="Total Reviews"
              value={formatNumber(stats?.total_course_reviews)}
            />
            <StatCard
              icon="book-outline"
              label="Available Courses"
              value={formatNumber(stats?.total_courses)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={() => loadProfileData(true)}>
          <Ionicons name="refresh-outline" size={18} color={BRAND_NAVY} />
          <Text style={styles.refreshButtonText}>Refresh Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    backgroundColor: BRAND_NAVY,
  },
  headerRow: {
    gap: 16,
    marginBottom: 20,
  },
  titleWrap: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244,67,54,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(68, 180, 110, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(158,240,180,0.35)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    color: '#dff8e6',
    flex: 1,
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244,67,54,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffd3d3',
    flex: 1,
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    color: BRAND_GOLD,
    fontSize: 16,
    fontWeight: '700',
  },
  infoGrid: {
    gap: 14,
  },
  infoCard: {
    backgroundColor: CARD_BG_HOVER,
    borderRadius: 14,
    padding: 16,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    color: BRAND_GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 22,
  },
  progressGrid: {
    gap: 14,
  },
  progressCard: {
    backgroundColor: CARD_BG_HOVER,
    borderRadius: 14,
    padding: 18,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(212,164,95,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
    fontSize: 14,
  },
  statsGrid: {
    gap: 14,
  },
  statCard: {
    backgroundColor: CARD_BG_HOVER,
    borderRadius: 14,
    padding: 18,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212,164,95,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: BRAND_GOLD,
    fontSize: 20,
    fontWeight: '700',
  },
  refreshButton: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_GOLD,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  refreshButtonText: {
    color: BRAND_NAVY,
    fontWeight: '700',
    fontSize: 15,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    color: '#fff',
    marginTop: 14,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.85,
  },
});