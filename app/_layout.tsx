// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { router, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, isLoading } = useAuth(); // ✅ matches AuthContext
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const onLandingPage = segments[0] === undefined;

    if (user && (inAuthGroup || onLandingPage)) {
      router.replace('/(tabs)');
      return;
    }

    if (!user && (inTabsGroup || !inAuthGroup && !onLandingPage)) {
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Landing page (index) */}
      <Stack.Screen name="index" />
      {/* Auth screens - handled by app/auth/_layout.tsx */}
      <Stack.Screen name="(tabs)" />
      {/* Feature screens - slide up as modals */}
      <Stack.Screen name="ChatbotScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="ResumeScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="QuizScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="CoursesScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="InterviewScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="AnalyticsScreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="onboarding-wrapper" options={{ presentation: 'modal' }} />
      <Stack.Screen name="SimulatorScreen" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
