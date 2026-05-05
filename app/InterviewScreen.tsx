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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../services/api';

type InterviewType = 'technical' | 'behavioral' | 'mixed';
type InterviewLevel = 'beginner' | 'intermediate' | 'advanced';

type InterviewQuestion = {
  id: string;
  question: string;
  category?: string;
};

type InterviewHistoryItem = {
  id?: string;
  interview_type?: string;
  level?: string;
  score?: number;
  createdAt?: string;
  completed_at?: string;
  totalQuestions?: number;
  total_questions?: number;
};

const INTERVIEW_TYPES: { key: InterviewType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  {
    key: 'technical',
    label: 'Technical',
    icon: 'code-slash-outline',
    description: 'Practice coding concepts, problem solving, and implementation thinking.',
  },
  {
    key: 'behavioral',
    label: 'Behavioral',
    icon: 'people-outline',
    description: 'Prepare for teamwork, leadership, conflict resolution, and communication questions.',
  },
  {
    key: 'mixed',
    label: 'Mixed',
    icon: 'layers-outline',
    description: 'A balanced interview with both technical and behavioral questions.',
  },
];

const LEVELS: { key: InterviewLevel; label: string; description: string }[] = [
  {
    key: 'beginner',
    label: 'Beginner',
    description: 'Entry-level questions with fundamentals and simple scenarios.',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    description: 'Role-ready questions that expect structured and practical answers.',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    description: 'Challenging prompts focused on depth, tradeoffs, and leadership.',
  },
];

const FALLBACK_QUESTIONS: Record<InterviewType, InterviewQuestion[]> = {
  technical: [
    { id: 't1', question: 'Explain the difference between state and props in React.', category: 'Frontend' },
    { id: 't2', question: 'What is the time complexity of binary search and why?', category: 'Algorithms' },
    { id: 't3', question: 'How would you design a scalable REST API for a job portal app?', category: 'System Design' },
    { id: 't4', question: 'What are database indexes and when can they hurt performance?', category: 'Backend' },
    { id: 't5', question: 'Describe how you would debug a slow mobile screen in production.', category: 'Performance' },
  ],
  behavioral: [
    { id: 'b1', question: 'Tell me about a time you handled a conflict within a team.', category: 'Teamwork' },
    { id: 'b2', question: 'Describe a situation where you had to learn something quickly.', category: 'Adaptability' },
    { id: 'b3', question: 'How do you prioritize competing deadlines?', category: 'Time Management' },
    { id: 'b4', question: 'Share an example of a mistake you made and what you learned from it.', category: 'Growth' },
    { id: 'b5', question: 'Describe a time you took initiative without being asked.', category: 'Leadership' },
  ],
  mixed: [
    { id: 'm1', question: 'Explain event bubbling and how you would use or prevent it.', category: 'Technical' },
    { id: 'm2', question: 'Tell me about a time you improved a process or workflow.', category: 'Behavioral' },
    { id: 'm3', question: 'What are the tradeoffs between SQL and NoSQL databases?', category: 'Technical' },
    { id: 'm4', question: 'Describe a challenging project and your specific contribution.', category: 'Behavioral' },
    { id: 'm5', question: 'How would you optimize app startup time in a React Native project?', category: 'Technical' },
  ],
};

const getFallbackQuestions = (type: InterviewType, level: InterviewLevel): InterviewQuestion[] => {
  const base = FALLBACK_QUESTIONS[type] || FALLBACK_QUESTIONS.mixed;
  if (level === 'beginner') {
    return base.slice(0, 3);
  }
  if (level === 'intermediate') {
    return base.slice(0, 4);
  }
  return base;
};

const normalizeQuestions = (data: any, type: InterviewType, level: InterviewLevel): InterviewQuestion[] => {
  const source = Array.isArray(data?.questions)
    ? data.questions
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.questions)
    ? data.data.questions
    : [];

  const normalized = source
    .map((item: any, index: number) => ({
      id: String(item?.id ?? item?._id ?? `${type}-${level}-${index}`),
      question: String(item?.question ?? item?.text ?? item?.prompt ?? '').trim(),
      category: item?.category ? String(item.category) : undefined,
    }))
    .filter((item: InterviewQuestion) => item.question.length > 0);

  return normalized.length > 0 ? normalized : getFallbackQuestions(type, level);
};

const formatDate = (value?: string) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString();
};

const InterviewScreen = () => {
  const [selectedType, setSelectedType] = useState<InterviewType>('technical');
  const [selectedLevel, setSelectedLevel] = useState<InterviewLevel>('beginner');
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [sessionQuestions, setSessionQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [totalScore, setTotalScore] = useState(0);

  const currentQuestion = useMemo(() => sessionQuestions[currentIndex], [sessionQuestions, currentIndex]);

  const fetchHistory = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setHistoryRefreshing(true);
      } else {
        setHistoryLoading(true);
      }
      setHistoryError('');
      const response = await api.get('/api/interview/history');
      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.history)
        ? response.data.history
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setHistory(items);
    } catch (error: any) {
      setHistoryError(error?.response?.data?.message || 'Unable to load interview history right now.');
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const evaluateAnswer = (value: string) => {
    const trimmed = value.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const lower = trimmed.toLowerCase();

    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wordCount >= 40) {
      score += 4;
      strengths.push('You provided a detailed response.');
    } else if (wordCount >= 20) {
      score += 3;
      strengths.push('Your answer has a reasonable amount of detail.');
    } else if (wordCount >= 10) {
      score += 2;
      improvements.push('Consider adding more depth and context.');
    } else {
      score += 1;
      improvements.push('Your answer is too short. Add examples, reasoning, and outcomes.');
    }

    if (/(example|for instance|for example|such as)/.test(lower)) {
      score += 2;
      strengths.push('You supported your answer with an example.');
    } else {
      improvements.push('Try including a concrete example to make your response stronger.');
    }

    if (/(because|therefore|so that|result|impact|outcome)/.test(lower)) {
      score += 2;
      strengths.push('You explained reasoning or impact clearly.');
    } else {
      improvements.push('Explain the reasoning behind your choices and the outcome.');
    }

    if (/(team|user|customer|project|performance|challenge|solution)/.test(lower)) {
      score += 1;
      strengths.push('You referenced relevant professional context.');
    }

    if (/(i |my |we |our )/.test(lower)) {
      score += 1;
      strengths.push('Your answer feels personal and ownership-driven.');
    } else {
      improvements.push('Use first-person language to show your direct contribution.');
    }

    const normalizedScore = Math.min(10, Math.max(1, score));

    const summary =
      normalizedScore >= 8
        ? 'Strong answer.'
        : normalizedScore >= 5
        ? 'Good foundation, but there is room to improve.'
        : 'This answer needs more structure and detail.';

    const feedbackText = [
      `${summary} Score: ${normalizedScore}/10.`,
      strengths.length ? `Strengths: ${strengths.join(' ')}` : '',
      improvements.length ? `Improve: ${improvements.join(' ')}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return { normalizedScore, feedbackText };
  };

  const startInterview = async () => {
    try {
      setStartingInterview(true);
      setSessionError('');
      setFeedback('');
      setFeedbackScore(null);
      setAnswer('');
      setAnswerSubmitted(false);
      setCurrentIndex(0);
      setInterviewCompleted(false);

      const response = await api.post(
        `/api/interview/start?interview_type=${encodeURIComponent(selectedType)}&level=${encodeURIComponent(selectedLevel)}`
      );

      const questions = normalizeQuestions(response?.data, selectedType, selectedLevel);
      setSessionQuestions(questions);
      setInterviewStarted(true);
      setTotalScore(0);
    } catch (error: any) {
      const fallbackQuestions = getFallbackQuestions(selectedType, selectedLevel);
      setSessionQuestions(fallbackQuestions);
      setInterviewStarted(true);
      setTotalScore(0);
      setSessionError(
        error?.response?.data?.message || 'Live questions were unavailable, so fallback interview questions were loaded.'
      );
    } finally {
      setStartingInterview(false);
    }
  };

  const submitAnswer = () => {
    if (!answer.trim()) {
      Alert.alert('Answer required', 'Please type your answer before submitting.');
      return;
    }

    const result = evaluateAnswer(answer);
    setFeedback(result.feedbackText);
    setFeedbackScore(result.normalizedScore);
    setAnswerSubmitted(true);
    setTotalScore((previous) => previous + result.normalizedScore);
  };

  const handleNextQuestion = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setAnswer('');
      setFeedback('');
      setFeedbackScore(null);
      setAnswerSubmitted(false);
      return;
    }

    setInterviewCompleted(true);
    setInterviewStarted(false);
    fetchHistory(true);
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setSessionQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setFeedback('');
    setFeedbackScore(null);
    setAnswerSubmitted(false);
    setSessionError('');
    setTotalScore(0);
  };

  const completionScore = sessionQuestions.length > 0 ? Math.round((totalScore / (sessionQuestions.length * 10)) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={historyRefreshing} onRefresh={() => fetchHistory(true)} tintColor="#d4a45f" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#d4a45f" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>AI Interview Practice</Text>
            <Text style={styles.headerSubtitle}>Train with structured questions, instant feedback, and saved history.</Text>
          </View>
        </View>

        {!interviewStarted && !interviewCompleted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview setup</Text>
            <Text style={styles.sectionDescription}>Choose the format and difficulty level before starting your practice session.</Text>

            <Text style={styles.groupLabel}>Interview type</Text>
            <View style={styles.cardGrid}>
              {INTERVIEW_TYPES.map((type) => {
                const selected = selectedType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.selectionCard, selected && styles.selectionCardActive]}
                    onPress={() => setSelectedType(type.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={type.icon} size={24} color={selected ? '#081833' : '#d4a45f'} />
                    <Text style={[styles.selectionTitle, selected && styles.selectionTitleActive]}>{type.label}</Text>
                    <Text style={[styles.selectionDescription, selected && styles.selectionDescriptionActive]}>{type.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.groupLabel}>Level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((level) => {
                const selected = selectedLevel === level.key;
                return (
                  <TouchableOpacity
                    key={level.key}
                    style={[styles.levelCard, selected && styles.levelCardActive]}
                    onPress={() => setSelectedLevel(level.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.levelTitle, selected && styles.levelTitleActive]}>{level.label}</Text>
                    <Text style={[styles.levelDescription, selected && styles.levelDescriptionActive]}>{level.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sessionError ? (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#d4a45f" />
                <Text style={styles.infoBannerText}>{sessionError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={startInterview} disabled={startingInterview} activeOpacity={0.85}>
              {startingInterview ? (
                <ActivityIndicator color="#081833" />
              ) : (
                <>
                  <Ionicons name="play-circle-outline" size={20} color="#081833" />
                  <Text style={styles.primaryButtonText}>Start interview</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {interviewStarted && currentQuestion && (
          <View style={styles.section}>
            <View style={styles.progressRow}>
              <Text style={styles.sectionTitle}>Active interview</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{sessionQuestions.length}
                </Text>
              </View>
            </View>

            <View style={styles.questionCard}>
              <View style={styles.questionMeta}>
                <Text style={styles.questionCategory}>{currentQuestion.category || selectedType}</Text>
                <Text style={styles.questionLevel}>{selectedLevel}</Text>
              </View>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            <Text style={styles.groupLabel}>Your answer</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Write a structured answer with context, action, and result..."
              placeholderTextColor="#7f8aa3"
              multiline
              textAlignVertical="top"
              editable={!answerSubmitted}
              style={[styles.answerInput, answerSubmitted && styles.answerInputDisabled]}
            />

            {!answerSubmitted ? (
              <TouchableOpacity style={styles.primaryButton} onPress={submitAnswer} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#081833" />
                <Text style={styles.primaryButtonText}>Submit answer</Text>
              </TouchableOpacity>
            ) : null}

            {answerSubmitted && feedback ? (
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackTitle}>Instant feedback</Text>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{feedbackScore}/10</Text>
                  </View>
                </View>
                <Text style={styles.feedbackText}>{feedback}</Text>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleNextQuestion} activeOpacity={0.85}>
                  <Ionicons
                    name={currentIndex === sessionQuestions.length - 1 ? 'flag-outline' : 'arrow-forward-circle-outline'}
                    size={20}
                    color="#d4a45f"
                  />
                  <Text style={styles.secondaryButtonText}>
                    {currentIndex === sessionQuestions.length - 1 ? 'Finish interview' : 'Next question'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {interviewCompleted && (
          <View style={styles.section}>
            <View style={styles.completionIcon}>
              <Ionicons name="trophy-outline" size={30} color="#081833" />
            </View>
            <Text style={styles.sectionTitle}>Interview completed</Text>
            <Text style={styles.sectionDescription}>
              You finished {sessionQuestions.length} question{sessionQuestions.length === 1 ? '' : 's'} with an overall score of {completionScore}%.
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{sessionQuestions.length}</Text>
                <Text style={styles.summaryLabel}>Questions</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalScore}</Text>
                <Text style={styles.summaryLabel}>Points earned</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{completionScore}%</Text>
                <Text style={styles.summaryLabel}>Overall</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={resetInterview} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={20} color="#081833" />
              <Text style={styles.primaryButtonText}>Practice again</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.progressRow}>
            <Text style={styles.sectionTitle}>Interview history</Text>
            <TouchableOpacity onPress={() => fetchHistory(true)} activeOpacity={0.8} style={styles.inlineRefresh}>
              <Ionicons name="refresh-outline" size={16} color="#d4a45f" />
              <Text style={styles.inlineRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#d4a45f" />
              <Text style={styles.stateText}>Loading history...</Text>
            </View>
          ) : historyError ? (
            <View style={styles.stateCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#d4a45f" />
              <Text style={styles.stateText}>{historyError}</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="time-outline" size={20} color="#d4a45f" />
              <Text style={styles.stateText}>No interview history yet. Complete a practice session to see it here.</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={item.id || `${item.interview_type || 'interview'}-${index}`} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    {(item.interview_type || 'Interview').toString().replace(/^\w/, (match) => match.toUpperCase())}
                  </Text>
                  <View style={styles.historyScore}>
                    <Text style={styles.historyScoreText}>{item.score ?? 0}</Text>
                  </View>
                </View>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMeta}>Level: {item.level || 'N/A'}</Text>
                  <Text style={styles.historyMeta}>
                    Questions: {item.totalQuestions ?? item.total_questions ?? 'N/A'}
                  </Text>
                </View>
                <Text style={styles.historyDate}>{formatDate(item.completed_at || item.createdAt)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterviewScreen;

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
    alignItems: 'flex-start',
    gap: 14,
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
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#c8d2e3',
  },
  section: {
    backgroundColor: '#10264a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1b335a',
  },
  sectionTitle: {
    fontSize: 22,
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
    fontSize: 17,
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
    fontSize: 16,
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
});