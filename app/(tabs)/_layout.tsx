// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { loadOnboarding } from '../../services/auth';
import { useCareerStore } from '../../src/store/careerStore';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';

export default function TabLayout() {
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const { 
    setProfile, 
    setEnrichedProfile, 
    setCareerMatches, 
    setRoadmap, 
    setJobs,
    setPipelineComplete 
  } = useCareerStore();

  useEffect(() => {
    const restoreOnboardingState = async () => {
      try {
        const onboardingData = await loadOnboarding();
        if (onboardingData && onboardingData.pipelineComplete) {
          console.log('Restoring onboarding data from backend...');
          setProfile(onboardingData.profile);
          if (onboardingData.enrichedProfile) {
            setEnrichedProfile(onboardingData.enrichedProfile);
          }
          if (onboardingData.careerMatches.length > 0) {
            setCareerMatches(onboardingData.careerMatches);
          }
          if (onboardingData.roadmap) {
            setRoadmap(onboardingData.roadmap);
          }
          if (onboardingData.jobs.length > 0) {
            setJobs(onboardingData.jobs);
          }
          setPipelineComplete(onboardingData.pipelineComplete);
          console.log('Onboarding data restored successfully');
        }
      } catch (error) {
        console.log('No onboarding data found or error loading:', error);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    restoreOnboardingState();
  }, []);

  // Don't render tabs until we've checked for onboarding data
  // This prevents a flash of empty state before data is restored
  if (isLoadingOnboarding) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_GOLD,
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: BRAND_NAVY,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 0.5,
          height: 75,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Roadmap',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
