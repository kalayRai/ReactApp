import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.1)';
const CARD_BG_HOVER = 'rgba(255,255,255,0.15)';

type LevelOption = 'Beginner' | 'Intermediate' | 'Advanced';

type RoadmapPhase = {
  name?: string;
  duration?: string;
  tasks?: string[];
};

type RoadmapResponse = {
  career?: string;
  total_duration?: string;
  phases?: RoadmapPhase[];
};

const LEVELS: LevelOption[] = ['Beginner', 'Intermediate', 'Advanced'];

const POPULAR_ROADMAPS = [
  {
    title: 'Web Development',
    icon: 'code-slash-outline' as const,
    preview: [
      'HTML & CSS Basics',
      'JavaScript Fundamentals',
      'React.js',
      'Backend with Node.js',
      'Deploy Projects',
    ],
  },
  {
    title: 'Data Science',
    icon: 'bar-chart-outline' as const,
    preview: [
      'Python Basics',
      'Data Analysis with Pandas',
      'Data Visualization',
      'Machine Learning',
      'Portfolio Projects',
    ],
  },
  {
    title: 'AI/ML Engineer',
    icon: 'hardware-chip-outline' as const,
    preview: [
      'Python & Numpy',
      'Machine Learning',
      'Deep Learning',
      'NLP & Transformers',
      'Real-World Projects',
    ],
  },
  {
    title: 'Cloud Computing',
    icon: 'cloud-outline' as const,
    preview: [
      'Linux Fundamentals',
      'AWS/Azure Basics',
      'Docker & Kubernetes',
      'Infrastructure as Code',
      'DevOps Practices',
    ],
  },
  {
    title: 'Cybersecurity',
    icon: 'shield-checkmark-outline' as const,
    preview: [
      'Networking Basics',
      'Security Fundamentals',
      'Ethical Hacking',
      'Cryptography',
      'Security Certifications',
    ],
  },
  {
    title: 'DevOps',
    icon: 'settings-outline' as const,
    preview: [
      'Linux Administration',
      'CI/CD Pipelines',
      'Docker & Kubernetes',
      'Infrastructure Automation',
      'Monitoring & Logging',
    ],
  },
];

const getErrorMessage = (error: any) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  'Failed to generate roadmap. Please try again.';

export default function RoadmapScreen() {
  const { user } = useAuth();
  const [career, setCareer] = useState('');
  const [level, setLevel] = useState<LevelOption>('Beginner');
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const trimmedCareer = useMemo(() => career.trim(), [career]);

  const handlePopularSelect = (selectedCareer: string) => {
    setCareer(selectedCareer);
    setError('');
  };

  const resetForm = () => {
    setCareer('');
    setLevel('Beginner');
    setRoadmap(null);
    setError('');
  };

  const generateRoadmap = async () => {
    if (!trimmedCareer) {
      setError('Please enter a career path.');
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please login to generate a personalized roadmap.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    setIsGenerating(true);
    setError('');
    setRoadmap(null);

    try {
      const response = await api.post('/generate-roadmap', {
        career: trimmedCareer,
        level,
      });

      const payload = response.data as RoadmapResponse;

      if (!Array.isArray(payload?.phases) || payload.phases.length === 0) {
        setError('No roadmap phases were generated. Please try again.');
        return;
      }

      setRoadmap(payload);
    } catch (err: any) {
      console.error('Error generating roadmap:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🗺️ Career Roadmap Generator</Text>
        <Text style={styles.subtitle}>
          Build a guided learning plan tailored to your target role and current level.
        </Text>

        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Career Path</Text>
            <TextInput
              value={career}
              onChangeText={setCareer}
              placeholder="e.g., Full Stack Developer, Data Scientist"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={styles.textInput}
              returnKeyType="done"
              onSubmitEditing={generateRoadmap}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skill Level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((item) => {
                const isSelected = item === level;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.levelChip, isSelected && styles.levelChipActive]}
                    onPress={() => setLevel(item)}
                  >
                    <Text
                      style={[
                        styles.levelChipText,
                        isSelected && styles.levelChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.disabledButton]}
            onPress={generateRoadmap}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={BRAND_NAVY} />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color={BRAND_NAVY} />
                <Text style={styles.generateButtonText}>Generate Roadmap</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#ff8b8b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isGenerating ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={BRAND_GOLD} />
            <Text style={styles.loadingText}>
              AI is creating your personalized roadmap...
            </Text>
          </View>
        ) : null}

        {roadmap ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {roadmap.career || trimmedCareer} Roadmap
              </Text>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.durationText}>
                  {roadmap.total_duration || '6-8 months'}
                </Text>
              </View>
            </View>

            <View style={styles.phaseList}>
              {roadmap.phases?.map((phase, index) => (
                <View key={`${phase.name || 'phase'}-${index}`} style={styles.phaseCard}>
                  <Text style={styles.phaseTitle}>
                    Phase {index + 1}: {phase.name || `Phase ${index + 1}`}
                  </Text>
                  <Text style={styles.phaseDuration}>
                    Duration: {phase.duration || 'Varies'}
                  </Text>

                  <View style={styles.taskList}>
                    {(phase.tasks && phase.tasks.length > 0
                      ? phase.tasks
                      : ['No specific tasks listed']
                    ).map((task, taskIndex) => (
                      <View key={`${task}-${taskIndex}`} style={styles.taskRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={BRAND_GOLD}
                          style={styles.taskIcon}
                        />
                        <Text style={styles.taskText}>{task}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.resetButtonText}>Generate Another Roadmap</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>⭐ Popular Career Roadmaps</Text>

          <View style={styles.popularGrid}>
            {POPULAR_ROADMAPS.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.popularCard}
                onPress={() => handlePopularSelect(item.title)}
              >
                <View style={styles.popularHeader}>
                  <Ionicons name={item.icon} size={22} color={BRAND_GOLD} />
                  <Text style={styles.popularTitle}>{item.title}</Text>
                </View>

                <View style={styles.previewList}>
                  {item.preview.map((point) => (
                    <View key={point} style={styles.previewRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color={BRAND_GOLD}
                      />
                      <Text style={styles.previewText}>{point}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.useButton}>
                  <Text style={styles.useButtonText}>Use This Roadmap</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  inputSection: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: BRAND_GOLD,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  levelChipActive: {
    backgroundColor: BRAND_GOLD,
    borderColor: BRAND_GOLD,
  },
  levelChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: BRAND_NAVY,
  },
  generateButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: BRAND_NAVY,
    fontWeight: '700',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.7)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    flex: 1,
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    marginTop: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  resultCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  resultHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,164,95,0.3)',
    paddingBottom: 18,
    marginBottom: 20,
  },
  resultTitle: {
    color: BRAND_GOLD,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,164,95,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  durationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  phaseList: {
    gap: 16,
  },
  phaseCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
  },
  phaseTitle: {
    color: BRAND_GOLD,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  phaseDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 14,
  },
  taskList: {
    gap: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  taskText: {
    color: '#fff',
    flex: 1,
    lineHeight: 22,
    fontSize: 14,
  },
  resetButton: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,164,95,0.5)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  popularSection: {
    marginTop: 4,
  },
  sectionTitle: {
    color: BRAND_GOLD,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  popularGrid: {
    gap: 16,
  },
  popularCard: {
    backgroundColor: CARD_BG_HOVER,
    borderRadius: 18,
    padding: 20,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  popularTitle: {
    color: BRAND_GOLD,
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
  },
  previewList: {
    gap: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  previewText: {
    color: '#fff',
    flex: 1,
    lineHeight: 21,
    fontSize: 14,
  },
  useButton: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: BRAND_GOLD,
    backgroundColor: 'rgba(212,164,95,0.2)',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  useButtonText: {
    color: BRAND_GOLD,
    fontWeight: '700',
    fontSize: 14,
  },
});