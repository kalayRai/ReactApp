import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.06)';

const QUIZ_QUESTIONS = [
  "What is your highest level of education?",
  "Which subjects or skills interest you the most?",
  "Do you prefer technical, creative, or people-focused work?",
  "What is your primary career goal right now?"
];

export default function QuizScreen() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (!answer.trim()) return;
    
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
      setAnswer('');
    } else {
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={80} color={BRAND_GOLD} />
          <Text style={styles.title}>Quiz Completed!</Text>
          <Text style={styles.subtitle}>Our AI is analyzing your answers to suggest the best career path.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={BRAND_GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Career Quiz</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Step {step + 1} of {QUIZ_QUESTIONS.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question</Text>
          <Text style={styles.questionText}>{QUIZ_QUESTIONS[step]}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Type your answer here..."
            placeholderTextColor="#7f8aa3"
            value={answer}
            onChangeText={setAnswer}
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, !answer.trim() && { opacity: 0.5 }]} 
          onPress={handleNext}
          disabled={!answer.trim()}
        >
          <Text style={styles.buttonText}>{step === QUIZ_QUESTIONS.length - 1 ? 'Finish' : 'Next Question'}</Text>
          <Ionicons name="arrow-forward" size={18} color={BRAND_NAVY} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, 
    backgroundColor: BRAND_NAVY, 
    paddingTop: Platform.OS === 'android' ? 25 : 0  
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  container: { padding: 20 },
  progressRow: { marginBottom: 30 },
  progressText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: BRAND_GOLD, borderRadius: 3 },
  questionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,164,95,0.2)',
    marginBottom: 24,
  },
  questionLabel: { color: BRAND_GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  questionText: { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 28, marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: BRAND_GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: { color: BRAND_NAVY, fontWeight: 'bold', fontSize: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  subtitle: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 10, marginBottom: 30 },
});