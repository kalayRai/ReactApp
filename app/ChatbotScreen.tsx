import React, { useState, useRef } from 'react';
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
import api from '../services/api';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const USER_BLUE = '#3559a8';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "🤖 Hello! I'm CareerHelper AI. How can I assist with your career guidance today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessageText = inputText.trim();
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userMessageText };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await api.post('/api/chat', { message: userMessageText });
      const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', sender: 'bot', text: "❌ Connection error. Please try again later." }]);
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
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        // 'padding' behavior is generally more consistent across Android devices
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
            placeholder="Type your question..."
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
    fontWeight: 'bold' 
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 32 
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
    // Using a consistent padding ensures it looks good when closed 
    // without adding extra "lift" when the keyboard opens.
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