// app/OnboardingWrapper.tsx - Wrapper to handle onboarding navigation
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen, { setOnboardingCallbacks } from './OnboardingScreen';

export default function OnboardingWrapper() {
  useEffect(() => {
    // Set up navigation callbacks
    setOnboardingCallbacks(
      () => {
        // On complete - go to Analytics
        router.push('/AnalyticsScreen');
      },
      () => {
        // On back - go back
        router.back();
      }
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OnboardingScreen />
    </View>
  );
}