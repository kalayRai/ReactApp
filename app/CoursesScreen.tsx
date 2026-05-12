// CoursesScreen.tsx - Courses discovery page (powered by multi_platform_courses.csv)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  loadCSVCourses,
  searchCSVCourses,
  getCoursesByRole,
  getAllCSVRoles,
  CSVCourse,
} from '../services/csvCourseLoader';

// ======================================================
// TYPES
// ======================================================

interface CourseCardData {
  title: string;
  platform: string;
  url: string;
  skills: string[];
  role: string;
  platformDisplay: string;
  platformColor: string;
  platformIcon: string;
  skillTags: string[];
  ratingDisplay: string;
  enrolledDisplay: string | null;
  price: string;
  key: string;
}

interface FilterChip {
  label: string;
  active: boolean;
  onPress: () => void;
}

// ======================================================
// PLATFORM HELPERS
// ======================================================

const PLATFORMS: Record<string, { name: string; color: string; icon: string }> = {
  coursera: { name: 'Coursera', color: '#0056D2', icon: '🏛️' },
  udemy: { name: 'Udemy', color: '#A435F0', icon: '💻' },
  edx: { name: 'edX', color: '#02262B', icon: '🎓' },
  freecodecamp: { name: 'freeCodeCamp', color: '#2E8B57', icon: '🔥' },
  codecademy: { name: 'Codecademy', color: '#3455D3', icon: '⌨️' },
  udacity: { name: 'Udacity', color: '#02B3E4', icon: '🎯' },
  datacamp: { name: 'DataCamp', color: '#031A0C', icon: '📊' },
  hubspot: { name: 'HubSpot', color: '#FF7A59', icon: '📢' },
};

const getPlatformInfo = (platform: string): { name: string; color: string; icon: string } => {
  const key = Object.keys(PLATFORMS).find(k => platform.toLowerCase().includes(k));
  return key ? PLATFORMS[key] : { name: platform, color: '#888', icon: '📚' };
};

// ======================================================
// COURSE CARD COMPONENT
// ======================================================

const CourseCard: React.FC<{
  course: CourseCardData;
  onPress: () => void;
}> = ({ course, onPress }) => {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.8}>
      {/* Platform Badge */}
      <View style={[styles.platformBadge, { backgroundColor: course.platformColor + '25' }]}>
        <Text style={styles.platformIcon}>{course.platformIcon}</Text>
        <Text style={[styles.platformName, { color: course.platformColor }]}>
          {course.platformDisplay}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.courseTitle} numberOfLines={2}>
        {course.title}
      </Text>

      {/* Skills */}
      <View style={styles.skillsRow}>
        {course.skillTags.map((skill, idx) => (
          <View key={idx} style={styles.skillChip}>
            <Text style={styles.skillChipText}>{skill}</Text>
          </View>
        ))}
      </View>

      {/* Meta Row */}
      <View style={styles.metaRow}>
        {/* Rating */}
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⭐</Text>
          <Text style={styles.metaValue}>{course.ratingDisplay}</Text>
        </View>

        {/* Enrolled */}
        {course.enrolledDisplay && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaValue}>{course.enrolledDisplay}</Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{course.price || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ======================================================
// MAIN SCREEN
// ======================================================

interface CoursesScreenProps {
  onLogout?: () => void;
}

const CoursesScreen: React.FC<CoursesScreenProps> = ({ onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Platform filter chips
  const filterChips: FilterChip[] = [
    { label: 'All', active: activeFilter === 'all', onPress: () => setActiveFilter('all') },
    { label: 'Coursera', active: activeFilter === 'coursera', onPress: () => setActiveFilter('coursera') },
    { label: 'Udemy', active: activeFilter === 'udemy', onPress: () => setActiveFilter('udemy') },
    { label: 'edX', active: activeFilter === 'edx', onPress: () => setActiveFilter('edx') },
  ];

  // Format CSV course for card display
  const formatCourseForCard = (course: CSVCourse, index: number): CourseCardData => {
    const platform = getPlatformInfo(course.platform);
    return {
      title: course.title,
      platform: course.platform,
      url: course.url,
      skills: course.skills,
      role: course.role,
      platformDisplay: platform.name,
      platformColor: platform.color,
      platformIcon: platform.icon,
      skillTags: course.skills?.slice(0, 3) || [],
      ratingDisplay: '4.5/5',
      enrolledDisplay: null,
      price: 'Free',
      key: `csv-${index}`,
    };
  };

  // Load all courses from CSV
  const loadCourses = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await loadCSVCourses();
      setCourses(data.map((c, i) => formatCourseForCard(c, i)));
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to all courses
      loadCourses();
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const allCourses = await loadCSVCourses();
      const results = searchCSVCourses(allCourses, searchQuery.trim());
      setCourses(results.map((c, i) => formatCourseForCard(c, i)));
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadCourses(true);
  }, []);

  const handleCoursePress = (course: CourseCardData) => {
    if (course.url && course.url !== '#') {
      Alert.alert(
        course.title,
        `Open this course on ${course.platformDisplay}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => Linking.openURL(course.url),
          },
        ]
      );
    } else {
      Alert.alert(course.title, `Platform: ${course.platformDisplay}`);
    }
  };

  // Filter courses by platform
  const filteredCourses = activeFilter === 'all'
    ? courses
    : courses.filter(c =>
        c.platform?.toLowerCase().includes(activeFilter.toLowerCase())
      );

  // ======================================================
  // RENDER
  // ======================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4a45f" />
        <Text style={styles.loadingText}>Discovering courses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingTop: StatusBar.currentHeight || 0 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#d4a45f" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Curated Courses</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleIcon}>📚</Text>
          <Text style={styles.mainTitle}>Course Discovery</Text>
          <Text style={styles.subtitle}>Find the best courses to level up your skills</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses (e.g. Python, Data Science)..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#081833" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filterChips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={[styles.filterChip, chip.active && styles.filterChipActive]}
              onPress={chip.onPress}
            >
              <Text style={[styles.filterChipText, chip.active && styles.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Course List */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <CourseCard course={item} onPress={() => handleCoursePress(item)} />
        )}
        contentContainerStyle={styles.courseList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d4a45f"
            colors={['#d4a45f']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptyMessage}>
              Try a different search term or refresh the list
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081833',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#081833',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(10, 20, 45, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  titleSection: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  titleIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: 'white',
    fontSize: 15,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 5,
  },
  searchButton: {
    backgroundColor: '#d4a45f',
    paddingHorizontal: 20,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#081833',
    fontSize: 15,
    fontWeight: '600',
  },
  filtersScroll: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipActive: {
    backgroundColor: '#d4a45f',
    borderColor: '#d4a45f',
  },
  filterChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#081833',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
  },
  resultsCount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    flex: 1,
  },
  errorDismiss: {
    color: '#ff6b6b',
    fontSize: 14,
    paddingLeft: 10,
  },
  courseList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  platformIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
    lineHeight: 22,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillChip: {
    backgroundColor: 'rgba(212, 164, 95, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  skillChipText: {
    color: '#d4a45f',
    fontSize: 11,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaValue: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  priceTag: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#66bb6a',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d4a45f',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default CoursesScreen;