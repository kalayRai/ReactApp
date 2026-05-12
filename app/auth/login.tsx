// app/auth/login.tsx
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
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
        <Ionicons name="arrow-back" size={22} color={BRAND_GOLD} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inner}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="briefcase-outline" size={28} color={BRAND_NAVY} />
            </View>
            <Text style={styles.brandName}>CareerHelper</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your career journey
          </Text>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={BRAND_NAVY} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}>
              Don't have an account?{' '}
              <Text style={{ color: BRAND_GOLD, fontWeight: 'bold' }}>
                Sign Up
              </Text>
            </Text>
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
  kav: { flex: 1 },
  backBtn: {
    padding: 16,
    paddingBottom: 0,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
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
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND_GOLD,
  },
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
    marginBottom: 36,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: '#fff',
    fontSize: 15,
  },
  eyeBtn: { padding: 4 },
  loginButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: BRAND_NAVY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupLink: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
});
