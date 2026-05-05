import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.1)';
const CARD_BG_HOVER = 'rgba(255,255,255,0.15)';

type Course = {
  course_title: string;
  role: string;
  skills: string;
  platform: string;
  url: string;
};

type CourseReview = {
  rating: number;
  review?: string;
  user: string;
  date: string;
};

const escapeText = (text?: string | null) => (text ? String(text) : '');

export default function CoursesScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
  }, [reviews]);

  const searchCourses = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setHasSearched(false);
      setCourses([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await api.post('/get-courses', { query: trimmedQuery });
      setCourses(Array.isArray(response.data?.results) ? response.data.results : []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
      Alert.alert('Error', 'Error loading courses');
    } finally {
      setIsSearching(false);
    }
  };

  const openCourseUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Invalid Link', 'Unable to open this course link.');
      return;
    }

    await Linking.openURL(url);
  };

  const showCourseReviews = async (courseTitle: string) => {
    setSelectedCourseTitle(courseTitle);
    setModalVisible(true);
    setIsLoadingReviews(true);
    setReviews([]);

    try {
      const response = await api.get(
        `/api/courses/${encodeURIComponent(courseTitle)}/reviews`
      );

      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      Alert.alert(
        'Error',
        "Could not load reviews. Please make sure you're logged in and try again."
      );
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const promptForRating = () => {
    Alert.alert('Rate this course', 'Choose a rating from 1 to 5 stars.', [
      { text: 'Cancel', style: 'cancel' },
      { text: '1', onPress: () => promptForReviewText(1) },
      { text: '2', onPress: () => promptForReviewText(2) },
      { text: '3', onPress: () => promptForReviewText(3) },
      { text: '4', onPress: () => promptForReviewText(4) },
      { text: '5', onPress: () => promptForReviewText(5) },
    ]);
  };

  const promptForReviewText = (rating: number) => {
    Alert.prompt(
      'Write your review',
      'Add an optional review for this course.',
      [
        { text: 'Skip', onPress: () => submitReview(rating, '') },
        {
          text: 'Submit',
          onPress: (reviewText?: string) => submitReview(rating, reviewText || ''),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      'plain-text'
    );
  };

  const submitReview = async (rating: number, reviewText: string) => {
    if (!selectedCourseTitle) return;

    try {
      const response = await api.post('/api/courses/review', {
        course_title: selectedCourseTitle,
        rating,
        review: reviewText,
      });

      Alert.alert(
        'Success',
        `Review added successfully!\nAverage rating: ${response.data?.average_rating ?? rating}/5`
      );

      if (modalVisible) {
        await showCourseReviews(selectedCourseTitle);
      }
    } catch (error: any) {
      console.error('Error adding review:', error);
      Alert.alert(
        'Error',
        `Error adding review: ${error?.response?.data?.detail || error?.message || 'Unknown error'}`
      );
    }
  };

  const addReview = (courseTitle: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add a review.');
      return;
    }

    setSelectedCourseTitle(courseTitle);
    promptForRating();
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
          <Text style={styles.stateText}>Searching for courses...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateIcon}>🔎</Text>
          <Text style={styles.stateText}>
            Enter a skill or role above to find courses
          </Text>
        </View>
      );
    }

    if (!courses.length) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateIcon}>📂</Text>
          <Text style={styles.stateText}>
            No courses found for "{escapeText(query.trim())}"
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🎓 Curated Courses</Text>

        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by role or skill (e.g., Python, Data Science)"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={searchCourses}
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchCourses}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {courses.length > 0 ? (
          <View style={styles.coursesGrid}>
            {courses.map((course, index) => (
              <View key={`${course.course_title}-${index}`} style={styles.courseCard}>
                <Text style={styles.courseTitle}>
                  📘 {escapeText(course.course_title)}
                </Text>
                <Text style={styles.courseMeta}>
                  <Text style={styles.metaLabel}>Role: </Text>
                  {escapeText(course.role)}
                </Text>
                <Text style={styles.courseMeta}>
                  <Text style={styles.metaLabel}>Skills: </Text>
                  {escapeText(course.skills)}
                </Text>

                <View style={styles.platformBadge}>
                  <Text style={styles.platformBadgeText}>
                    🌐 {escapeText(course.platform)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => openCourseUrl(course.url)}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkButtonText}>View Course →</Text>
                </TouchableOpacity>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => showCourseReviews(course.course_title)}
                  >
                    <Text style={styles.reviewButtonText}>★ View Reviews</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addReviewButton}
                    onPress={() => addReview(course.course_title)}
                  >
                    <Text style={styles.addReviewButtonText}>＋ Add Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {isLoadingReviews ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={BRAND_GOLD} />
                <Text style={styles.stateText}>Loading reviews...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  📝 Reviews for "{escapeText(selectedCourseTitle)}"
                </Text>

                {reviews.length > 0 ? (
                  <>
                    <View style={styles.averageRatingBox}>
                      <Text style={styles.averageRatingText}>
                        ⭐ Average Rating: {'⭐'.repeat(Math.round(averageRating))} (
                        {averageRating.toFixed(1)}/5)
                      </Text>
                    </View>

                    <ScrollView
                      style={styles.reviewsList}
                      showsVerticalScrollIndicator={false}
                    >
                      {reviews.map((review, index) => (
                        <View key={`${review.user}-${review.date}-${index}`} style={styles.reviewItem}>
                          <Text style={styles.ratingText}>
                            {'⭐'.repeat(review.rating)}
                          </Text>
                          <Text style={styles.reviewText}>
                            {escapeText(review.review) || 'No review text provided'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            — {escapeText(review.user)} on{' '}
                            {new Date(review.date).toLocaleDateString()}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <Text style={styles.emptyReviewText}>
                    No reviews yet. Be the first to review this course!
                  </Text>
                )}

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    backgroundColor: BRAND_NAVY,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 30,
  },
  searchSection: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  searchBox: {
    gap: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: BRAND_NAVY,
    fontWeight: '700',
    fontSize: 16,
  },
  coursesGrid: {
    gap: 18,
  },
  courseCard: {
    backgroundColor: CARD_BG_HOVER,
    borderRadius: 15,
    padding: 20,
  },
  courseTitle: {
    color: BRAND_GOLD,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  courseMeta: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  metaLabel: {
    fontWeight: '700',
    color: '#fff',
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,164,95,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  platformBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  linkButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: BRAND_GOLD,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  reviewButton: {
    backgroundColor: 'rgba(53, 89, 168, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: 'rgba(212,164,95,0.8)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  addReviewButtonText: {
    color: BRAND_NAVY,
    fontSize: 12,
    fontWeight: '700',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  stateIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  stateText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    opacity: 0.85,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d2250',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,164,95,0.3)',
    maxHeight: '80%',
  },
  modalTitle: {
    color: BRAND_GOLD,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  averageRatingBox: {
    backgroundColor: 'rgba(212,164,95,0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  averageRatingText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewsList: {
    maxHeight: 320,
  },
  reviewItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 18,
    marginBottom: 8,
  },
  reviewText: {
    color: '#fff',
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  emptyReviewText: {
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 20,
    lineHeight: 22,
  },
  modalButtonRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeModalButton: {
    backgroundColor: BRAND_GOLD,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeModalButtonText: {
    color: BRAND_NAVY,
    fontWeight: '700',
  },
});
