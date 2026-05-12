// app/(tabs)/index.tsx  ← Home Screen
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCareerStore } from '../../src/store/careerStore';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.06)';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  route: string;
  wide?: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'chatbot',
    title: 'Chatbot',
    description: 'Chat with AI for personalized career recommendations.',
    icon: 'chatbubble-ellipses-outline',
    iconBg: 'rgba(29,78,216,0.2)',
    iconColor: '#60A5FA',
    route: '/ChatbotScreen',
  },
  {
    id: 'resume',
    title: 'Analyze Resume',
    description: 'Upload your resume and get AI-powered improvement tips.',
    icon: 'document-text-outline',
    iconBg: 'rgba(124,58,237,0.2)',
    iconColor: '#A78BFA',
    route: '/ResumeScreen',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    description: 'Test your knowledge and prepare for interviews.',
    icon: 'help-circle-outline',
    iconBg: 'rgba(5,150,105,0.2)',
    iconColor: '#34D399',
    route: '/QuizScreen',
  },
  {
    id: 'courses',
    title: 'Courses',
    description: 'Browse career-focused courses and learning paths.',
    icon: 'book-outline',
    iconBg: 'rgba(59,130,246,0.2)',
    iconColor: '#3B82F6',
    route: '/CoursesScreen',
  },
  {
    id: 'interview',
    title: 'Interview',
    description: 'Practice mock interviews with AI feedback.',
    icon: 'mic-outline',
    iconBg: 'rgba(217,119,6,0.2)',
    iconColor: '#FCD34D',
    route: '/InterviewScreen',
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description:
      'Track career trends, market insights, and your learning progress.',
    icon: 'analytics-outline',
    iconBg: BRAND_GOLD,
    iconColor: BRAND_NAVY,
    route: '/AnalyticsScreen',
    wide: true,
  },
  {
    id: 'onboarding',
    title: 'Career Onboarding',
    description: 'Get started with a personalized career roadmap.',
    icon: 'rocket-outline',
    iconBg: 'rgba(220,38,38,0.2)',
    iconColor: '#EF4444',
    route: '/onboarding-wrapper',
  },
  {
    id: 'simulator',
    title: 'Career Simulator',
    description: 'Model how new skills shift your career matches.',
    icon: 'game-controller-outline',
    iconBg: 'rgba(16,185,129,0.2)',
    iconColor: '#10B981',
    route: '/SimulatorScreen',
  }
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { pipelineComplete, careerMatches } = useCareerStore();

  // Derive initials from user name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const GridCards = FEATURES.filter((f) => !f.wide);
  const WideCard = FEATURES.find((f) => f.wide);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || !user) {
        return undefined;
      }

      const handleBackPress = () => {
        Alert.alert('Logout', 'Do you want to logout?', [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => {
              void (async () => {
                await logout();
                router.dismissAll();
                router.replace('/');
              })();
            },
          },
        ]);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      return () => subscription.remove();
    }, [user, logout])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()} 👋
          </Text>
          <Text style={styles.pageTitle}>Home</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Features</Text>

        {/* 2-column grid for first 4 cards */}
        <View style={styles.grid}>
          {GridCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.75}
            >
              <View
                style={[styles.cardIconWrap, { backgroundColor: card.iconBg }]}
              >
                <Ionicons
                  name={card.icon as any}
                  size={22}
                  color={card.iconColor}
                />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDesc}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wide analytics card */}
        {WideCard && (
          <TouchableOpacity
            style={styles.wideCard}
            onPress={() => router.push(WideCard.route as any)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.wideIconWrap,
                { backgroundColor: WideCard.iconBg },
              ]}
            >
              <Ionicons
                name={WideCard.icon as any}
                size={26}
                color={WideCard.iconColor}
              />
            </View>
            <View style={styles.wideText}>
              <Text style={styles.wideTitle}>{WideCard.title}</Text>
              <Text style={styles.wideDesc}>
                {pipelineComplete && careerMatches.length > 0
                  ? `${careerMatches.length} career matches ready · Tap to view`
                  : WideCard.description}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={BRAND_GOLD}
              style={{ alignSelf: 'center' }}
            />
          </TouchableOpacity>
        )}

        {/* Quick tip banner */}
        <View style={styles.tipBanner}>
          <Ionicons name="information-circle-outline" size={18} color={BRAND_GOLD} />
          <Text style={styles.tipText}>
            Start with the{' '}
            <Text style={{ color: BRAND_GOLD, fontWeight: '600' }}>
              AI Chatbot
            </Text>{' '}
            to get personalized career guidance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, 
    backgroundColor: BRAND_NAVY, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  greeting: { fontSize: 12, color: '#888', marginBottom: 2 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: 'bold', color: BRAND_NAVY },

  scrollContent: { padding: 18, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // ── 2-col Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cardDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
  },

  // ── Wide Card ──
  wideCard: {
    backgroundColor: 'rgba(212,164,95,0.1)',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(212,164,95,0.3)',
    marginBottom: 14,
  },
  wideIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  wideText: { flex: 1 },
  wideTitle: { fontSize: 16, fontWeight: 'bold', color: BRAND_GOLD, marginBottom: 4 },
  wideDesc: { fontSize: 12, color: '#aaa', lineHeight: 17 },

  // ── Tip Banner ──
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(212,164,95,0.08)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_GOLD,
  },
  tipText: { flex: 1, color: '#aaa', fontSize: 12, lineHeight: 18 },
});
