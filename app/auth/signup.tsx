// app/auth/signup.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    showToggle,
    toggleState,
    onToggle,
  }: any) => (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color="#666" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !toggleState}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons
            name={toggleState ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={BRAND_GOLD} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="briefcase-outline" size={28} color={BRAND_NAVY} />
            </View>
            <Text style={styles.brandName}>CareerHelper</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start your AI-powered career journey today
          </Text>

          <Field
            icon="person-outline"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <Field
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showToggle
            toggleState={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            showToggle
            toggleState={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />

          {/* Password strength hint */}
          <Text style={styles.hint}>
            Password must be at least 6 characters
          </Text>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={BRAND_NAVY} />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>
              Already have an account?{' '}
              <Text style={{ color: BRAND_GOLD, fontWeight: 'bold' }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, 
    backgroundColor: BRAND_NAVY,
    paddingTop: Platform.OS === 'android' ? 25 : 0
  },
  kav: { flex: 1 },
  backBtn: { padding: 16, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    justifyContent: 'center',
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: { fontSize: 22, fontWeight: 'bold', color: BRAND_GOLD },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: { marginRight: 8 },
  input: { paddingVertical: 15, color: '#fff', fontSize: 15 },
  eyeBtn: { padding: 4 },
  hint: { fontSize: 12, color: '#555', marginBottom: 20, marginTop: 4 },
  signupButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signupButtonText: { color: BRAND_NAVY, fontWeight: 'bold', fontSize: 16 },
  loginLink: { color: '#888', textAlign: 'center', fontSize: 14 },
});
