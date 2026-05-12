// app/index.tsx  ← Landing Page (shown on app launch)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from 'react-native';
import { router, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { useCareerStore } from '../src/store/careerStore';
const { width, height } = Dimensions.get('window');

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.06)';

const STATS = [
  { value: '50K+', label: 'Users Helped' },
  { value: '4.9★', label: 'App Rating' },
  { value: '200+', label: 'Career Paths' },
];

const FEATURES = [
  { icon: 'chatbubble-ellipses-outline', label: 'AI Chatbot' },
  { icon: 'document-text-outline', label: 'Resume AI' },
  { icon: 'bulb-outline', label: 'Mock Quiz' },
  { icon: 'book-outline', label: 'Courses' },
  { icon: 'mic-outline', label: 'Interviews' },
  { icon: 'settings-outline', label: 'Onboarding' },
  { icon: 'rocket-outline', label: 'Simulator' },
];

export default function LandingScreen() {
  const { user } = useAuth();
  const { pipelineComplete, careerMatches } = useCareerStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // If already logged in, jump straight to tabs
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Text style={styles.brandName}>CareerHelper</Text>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.btnOutlineText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnFilled}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.btnFilledText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View
          style={[
            styles.heroCard,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Icon Ring */}
          <View style={styles.iconRing}>
            <Ionicons name="briefcase-outline" size={38} color={BRAND_NAVY} />
          </View>

          {/* Live badge */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live AI Assistance</Text>
          </View>

          {/* Feature icon row */}
          <View style={styles.featureRow}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureChip}>
                <Ionicons name={f.icon as any} size={18} color={BRAND_GOLD} />
                <Text style={styles.featureChipText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* NEW: Onboarding & Simulator Cards */}
        <View style={styles.specialCardsContainer}>
          {/* Onboarding Card */}
          <TouchableOpacity
            style={styles.specialCard}
            onPress={() => router.push('/OnboardingScreen')}
            activeOpacity={0.85}
          >
            <View style={styles.specialCardIcon}>
              <Ionicons name="rocket-outline" size={32} color={BRAND_GOLD} />
            </View>
            <View style={styles.specialCardContent}>
              <Text style={styles.specialCardTitle}>🎯 Get Your Career Plan</Text>
              <Text style={styles.specialCardDesc}>
                Complete AI-powered onboarding to receive personalized career matches, learning roadmap, and job recommendations
              </Text>
              <View style={styles.specialCardBadge}>
                <Ionicons name="flash" size={14} color={BRAND_GOLD} />
                <Text style={styles.specialCardBadgeText}>AI-Powered Analysis</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Simulator Card */}
          <TouchableOpacity
            style={styles.specialCard}
            onPress={() => router.push('/SimulatorScreen')}
            activeOpacity={0.85}
          >
            <View style={styles.specialCardIcon}>
              <Ionicons name="stats-chart-outline" size={32} color={BRAND_GOLD} />
            </View>
            <View style={styles.specialCardContent}>
              <Text style={styles.specialCardTitle}>📊 Career Simulator</Text>
              <Text style={styles.specialCardDesc}>
                Simulate different career paths, explore "what-if" scenarios, and get detailed learning roadmaps
              </Text>
              <View style={styles.specialCardBadge}>
                <Ionicons name="trending-up" size={14} color={BRAND_GOLD} />
                <Text style={styles.specialCardBadgeText}>Interactive Simulation</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Original Features Section (Optional - can keep or remove) */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Features</Text>
          <View style={styles.quickFeaturesGrid}>
            {FEATURES.map((feature, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.quickFeatureCard}
                onPress={() => {
                  // Navigate to corresponding feature
                  const routeMap: Record<string, string> = {
                    'AI Chatbot': '/ChatbotScreen',
                    'Resume AI': '/ResumeScreen',
                    'Mock Quiz': '/QuizScreen',
                    'Courses': '/CoursesScreen',
                    'Interviews': '/InterviewScreen',
                  };
                  router.push((routeMap[feature.label] as any) || '/ChatbotScreen');
                }}
              >
                <Ionicons name={feature.icon as any} size={24} color={BRAND_GOLD} />
                <Text style={styles.quickFeatureLabel}>{feature.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Headline */}
        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>
            Land your{' '}
            <Text style={styles.headlineAccent}>dream job</Text>
            {'\n'}with AI guidance
          </Text>
          <Text style={styles.subtext}>
            Personalized career recommendations, resume analysis,
            mock interviews & more — all in one place.
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaSecondaryText}>
              Already have an account?{' '}
              <Text style={{ color: BRAND_GOLD, fontWeight: 'bold' }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
    paddingTop: 25,
  },

  // ── Top Nav ──
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_GOLD,
    letterSpacing: -0.3,
  },
  navButtons: { flexDirection: 'row', gap: 8 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: BRAND_GOLD,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  btnOutlineText: { color: BRAND_GOLD, fontSize: 13, fontWeight: '600' },
  btnFilled: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  btnFilledText: { color: BRAND_NAVY, fontSize: 13, fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Hero Card ──
  heroCard: {
    marginTop: 24,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(212,164,95,0.3)',
    gap: 18,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveBadgeText: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212,164,95,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featureChipText: { color: BRAND_GOLD, fontSize: 11, fontWeight: '500' },

  // ── Special Cards (Onboarding & Simulator) ──
  specialCardsContainer: {
    marginTop: 20,
    gap: 16,
  },
  specialCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,164,95,0.2)',
  },
  specialCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,164,95,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialCardContent: {
    flex: 1,
    gap: 6,
  },
  specialCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  specialCardDesc: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  specialCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  specialCardBadgeText: {
    fontSize: 11,
    color: BRAND_GOLD,
    fontWeight: '500',
  },

  // ── Features Section ──
  featuresSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  quickFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickFeatureCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: (width - 52) / 2,
    borderWidth: 0.5,
    borderColor: 'rgba(212,164,95,0.2)',
  },
  quickFeatureLabel: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Stats (if needed) ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_GOLD,
  },
  statLabel: { fontSize: 10, color: '#888', marginTop: 3, textAlign: 'center' },

  // ── Headline ──
  headlineBlock: { marginTop: 28, alignItems: 'center' },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  headlineAccent: { color: BRAND_GOLD },
  subtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 300,
  },

  // ── CTA ──
  ctaBlock: { marginTop: 30, gap: 12 },
  ctaSecondary: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(212,164,95,0.3)',
  },
  ctaSecondaryText: { color: '#aaa', fontSize: 14 },
});
