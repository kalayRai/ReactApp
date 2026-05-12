import React, { useState, useRef } from 'react';
import { useCareerStore } from '../src/store/careerStore';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { callClaude } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const USER_BLUE = '#3559a8';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

// Related topics for career guidance
const CAREER_TOPICS = [
  'career', 'job', 'resume', 'cv', 'interview', 'skills', 'salary', 'growth',
  'learning', 'course', 'certificate', 'degree', 'education', 'experience',
  'promotion', 'transition', 'switch', 'industry', 'tech', 'programming',
  'developer', 'data', 'ai', 'ml', 'cloud', 'devops', 'design', 'product',
  'management', 'remote', 'work', 'office', 'hybrid', 'networking',
  'portfolio', 'project', 'coding', 'python', 'javascript', 'react', 'node',
  'aws', 'az', 'google cloud', 'docker', 'kubernetes', 'agile', 'scrum',
  'leadership', 'communication', 'team', 'collaboration', 'soft skills',
  'professional', 'business', 'startup', 'freelance', 'consulting',
  'mentor', 'coach', 'careerHelper', 'roadmap', 'jobs', 'match', 'fit'
];

const isCareerRelated = (text: string): boolean => {
  const lower = text.toLowerCase();
  return CAREER_TOPICS.some(topic => lower.includes(topic));
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "🤖 Hello! I'm your AI Career Advisor. I specialize in helping with career guidance, job search, interview prep, skill development, and learning roadmaps. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { profile, careerMatches } = useCareerStore();

  const buildCareerContext = (): string => {
    const top = careerMatches[0];
    const context = [
      profile.name ? `User name: ${profile.name}` : '',
      profile.currentRole ? `Current role: ${profile.currentRole}` : '',
      profile.skills.length ? `Current skills: ${profile.skills.join(', ')}` : '',
      profile.goals ? `Career goals: ${profile.goals}` : '',
      profile.education ? `Education: ${profile.education}` : '',
      top ? `Top career match: ${top.title} (${top.fitScore}% match)` : '',
      top?.keyGaps?.length ? `Skills to develop: ${top.keyGaps.join(', ')}` : '',
      top?.reasoning ? `Career analysis: ${top.reasoning}` : '',
    ].filter(Boolean).join('\n');
    return context;
  };

  const getCareerAdviceSystemPrompt = (): string => {
    const careerContext = buildCareerContext();
    return `You are an expert AI Career Advisor with 20+ years of experience in career coaching, professional development, and job market insights.

CORE IDENTITY:
- You ONLY provide career, job search, and professional development advice
- You are knowledgeable about tech careers, learning paths, certifications, and industry trends
- You give practical, actionable guidance

STRICT RULES:
1. If asked about topics unrelated to career/professional development, politely redirect:
   "I'm a career advisor AI, so I focus on career guidance! How about I help you with your professional development instead? Ask me about job searching, interview prep, skill building, or career transitions."

2. Keep responses concise: 2-4 sentences for quick advice, longer for detailed guidance

3. Be encouraging but honest about challenges

4. Always tie advice to the user's specific situation when available

${careerContext ? `USER CONTEXT:\n${careerContext}\n` : ''}

Remember: You are a career advisor. Stay focused on professional development topics.`;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessageText = inputText.trim();

    // Check if message is career-related
    if (!isCareerRelated(userMessageText)) {
      const offTopicMsg: Message = { 
        id: Date.now().toString(), 
        sender: 'bot', 
        text: "I'm a career advisor AI, so I focus on career guidance! How about I help you with your professional development instead? Ask me about job searching, interview prep, skill building, learning roadmaps, or career transitions. 🚀" 
      };
      setMessages(prev => [...prev, offTopicMsg]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await callClaude(
        getCareerAdviceSystemPrompt(),
        [{
          role: 'user',
          content: userMessageText
        }],
        500
      );

      // Clean up response - remove markdown if any
      const cleanResponse = response.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: cleanResponse || "I apologize, but I couldn't generate a response. Could you try rephrasing your career question?" 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      // Provide helpful fallback response about CS career paths
      const fallbackResponses: Record<string, string> = {
        'default': "I'm having trouble connecting to the AI right now. For computer science graduates, popular career paths include: Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, Machine Learning Engineer, DevOps Engineer, Cloud Engineer, and Product Manager. Would you like tips on any specific path?",
        'career': "For CS graduates, I recommend exploring these paths: 1) Software Development (web/mobile apps), 2) Data & AI (data science, ML), 3) Cloud/DevOps (AWS, Azure), 4) Cybersecurity. Start by building projects in your area of interest!",
        'skills': "Key skills for CS grads: 1) Programming (Python, JavaScript, Java), 2) Data Structures & Algorithms, 3) SQL & Databases, 4) Git & Version Control, 5) Cloud Basics. Focus on building a strong portfolio with personal projects.",
        'interview': "For tech interviews: 1) Practice LeetCode (focus on arrays, strings, trees), 2) Review system design basics, 3) Prepare for behavioral questions using STAR method, 4) Research the company beforehand. Good luck!",
        'learning': "Learning roadmap for CS grads: 1) Pick a specialization (web, mobile, data, cloud), 2) Complete online courses (Coursera, Udemy), 3) Build 3-5 portfolio projects, 4) Contribute to open source, 5) Network on LinkedIn. Consistency is key!"
      };
      
      const userLower = userMessageText.toLowerCase();
      let response = fallbackResponses.default;
      if (userLower.includes('skill')) response = fallbackResponses.skills;
      else if (userLower.includes('interview')) response = fallbackResponses.interview;
      else if (userLower.includes('learn') || userLower.includes('course') || userLower.includes('path')) response = fallbackResponses.learning;
      else if (userLower.includes('career') || userLower.includes('job')) response = fallbackResponses.career;
      
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: response
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.messageText, item.sender === 'bot' ? styles.botText : styles.userText]}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BRAND_GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Career Advisor</Text>
        <View style={{ width: 40}} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about careers, jobs, skills..."
            placeholderTextColor="#7f8aa3"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isThinking}>
            {isThinking ? <ActivityIndicator color={BRAND_NAVY} size="small" /> : <Ionicons name="send" size={20} color={BRAND_NAVY} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, 
    backgroundColor: BRAND_NAVY, 
    paddingTop: Platform.OS === 'android' ? 25 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    paddingRight: 8,
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 32,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  botBubble: {
    backgroundColor: BRAND_GOLD,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: USER_BLUE,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: BRAND_NAVY },
  userText: { color: '#fff' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(10, 20, 45, 0.95)',
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 16,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
});