import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { analyzeResumeWithAI } from '../services/api';

const BRAND_NAVY = '#081833';
const BRAND_GOLD = '#d4a45f';
const CARD_BG = 'rgba(255,255,255,0.06)';

// Allowed MIME types for resume files
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

// Keywords that STRONGLY suggest a document is a resume
const RESUME_INDICATORS = [
  'experience', 'education', 'skills', 'employment', 'work history',
  'certification', 'certifications', 'achievements', 'summary', 'objective',
  'projects', 'portfolio', 'references', 'qualifications', 'competencies',
  'professional experience', 'work experience', 'education background',
  'technical skills', 'soft skills', 'languages', 'interests', 'extracurricular',
  'objective', 'career objective', 'profile summary', 'personal summary',
  'contact information', 'email', 'phone', 'address', 'linkedin',
];

// Keywords that suggest a document is NOT a resume
const NON_RESUME_INDICATORS = [
  'invoice', 'receipt', 'purchase order', 'contract', 'agreement',
  'chapter', 'table of contents', 'copyright', 'isbn', 'publisher',
  'figure', 'caption', 'illustration', 'abstract', 'methodology',
  'references cited', 'bibliography', 'acknowledgments', 'dedication',
  'table of figures', 'list of tables', 'noreferrer', 'noopener',
];

type AnalysisData = {
  overview: string;
  score: number;
  skillGaps: string[];
  feedback: string[];
  roadmap: string[];
};

export default function ResumeScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  // Helper to parse **bold** markers and apply consistent gold color
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\d+\.)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={{ color: BRAND_GOLD, fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (/^\d+\.$/.test(part)) {
        return (
          <Text key={index} style={{ color: BRAND_GOLD, fontWeight: 'bold' }}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      
      if (!result.canceled) {
        setSelectedFile(result);
        setAnalysisResult(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const isLikelyResume = (text: string): { isResume: boolean; reason?: string; score: number } => {
    const lower = text.toLowerCase();
    const resumeScore = RESUME_INDICATORS.filter(k => lower.includes(k)).length;
    const nonResumeScore = NON_RESUME_INDICATORS.filter(k => lower.includes(k)).length;

    // Strong rejection signals
    if (nonResumeScore >= 2 && resumeScore < 3) {
      return { isResume: false, reason: 'This document does not appear to be a resume (e.g., it may be a contract, book chapter, invoice, or academic paper). Please upload your actual resume (PDF or DOCX).', score: 0 };
    }

    // Need at least 3 resume indicators to be considered valid
    if (resumeScore < 3) {
      return { isResume: false, reason: 'This document does not contain typical resume sections (experience, education, skills, etc.). Please upload your resume file.', score: resumeScore };
    }

    return { isResume: true, score: resumeScore };
  };

  const uploadAndAnalyze = async () => {
    if (!selectedFile || selectedFile.canceled) {
      console.log('No file selected');
      return;
    }

    const asset = selectedFile.assets[0];
    if (!asset) {
      console.log('No asset in selectedFile');
      Alert.alert('Error', 'File information not found. Please try selecting the file again.');
      return;
    }

    console.log('Starting analysis for:', asset.name, 'URI:', asset.uri);
    const fileName = asset.name.toLowerCase();

    // === STEP 1: Validate file type ===
    const isPdf = fileName.endsWith('.pdf');
    const isDocx = fileName.endsWith('.docx') || fileName.endsWith('.doc');

    if (!isPdf && !isDocx) {
      Alert.alert(
        'Invalid File Type',
        'Please upload a PDF or DOCX resume file. Other document types are not supported for analysis.',
        [{ text: 'OK' }]
      );
      return;
    }

    // File size check (max 5MB)
    if (asset.size && asset.size > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Please upload a resume file under 5MB.');
      return;
    }

    setIsUploading(true);
    setAnalysisResult(null);
    console.log('State set, isUploading should now be true');

    try {
      // === STEP 2: Validate file looks like a resume (before spending API call) ===
      const resumeFilenameIndicators = ['resume', 'cv', 'curriculum', 'vitae', 'bio', 'profile'];
      const nonResumeFilenameIndicators = ['invoice', 'contract', 'agreement', 'report', 'article', 'chapter', 'book', 'note', 'ticket', 'receipt'];
      const hasResumeFilename = resumeFilenameIndicators.some(k => fileName.includes(k));
      const hasNonResumeFilename = nonResumeFilenameIndicators.some(k => fileName.includes(k));

      // Extract text from file if possible
      let extractedText = '';
      if (asset.uri && (asset.uri.startsWith('http://') || asset.uri.startsWith('https://') || asset.uri.startsWith('file://') || asset.uri.startsWith('content://'))) {
        try {
          console.log('Fetching file from URI:', asset.uri);
          const response = await fetch(asset.uri);
          console.log('Fetch response status:', response.status);
          if (response.ok) {
            const textContent = await response.text();
            const cleanText = textContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
            if (cleanText.length > 50) {
              extractedText = cleanText.substring(0, 8000);
              console.log('Extracted text length:', extractedText.length);
            }
          }
        } catch (readErr) {
          console.log('File fetch error (normal for local files):', readErr);
        }
      }

      // Strong rejection: filename says non-resume AND no extracted text
      if (hasNonResumeFilename && extractedText.trim().length < 100) {
        console.log('Rejected: non-resume filename + no text');
        Alert.alert(
          'Not a Resume',
          `"${asset.name}" does not appear to be a resume. Please upload a file named "Resume.pdf" or "My_CV.docx" that contains your professional experience, education, and skills.`,
          [{ text: 'OK' }]
        );
        setIsUploading(false);
        return;
      }

      // Client-side resume validation (only if we have text)
      if (extractedText && extractedText.trim().length > 100) {
        const quickCheck = isLikelyResume(extractedText);
        if (!quickCheck.isResume) {
          console.log('Rejected by keyword check:', quickCheck.reason);
          Alert.alert('Not a Resume', quickCheck.reason, [{ text: 'OK' }]);
          setIsUploading(false);
          return;
        }
        console.log('Passed keyword validation, score:', quickCheck.score);
      } else if (!hasResumeFilename && extractedText.trim().length < 100) {
        // No text and filename doesn't suggest resume
        console.log('Rejected: no text and no resume filename');
        Alert.alert(
          'Not a Resume',
          `"${asset.name}" does not appear to be a resume. Please upload a file with "Resume" or "CV" in the filename that contains your professional experience, education, and skills.`,
          [{ text: 'OK' }]
        );
        setIsUploading(false);
        return;
      }

      // === STEP 3: Build prompt for AI ===
      let resumePrompt: string;
      if (extractedText && extractedText.trim().length > 100) {
        resumePrompt = `Resume content:\n${extractedText}`;
        console.log('Using extracted text for analysis');
      } else {
        resumePrompt = `Resume file: "${asset.name}". Please analyze this document. If it IS a resume, provide your analysis. If it is NOT a resume (e.g., contract, invoice, book chapter), clearly identify it as non-resume.`;
        console.log('No extractable text, using filename prompt');
      }

      // === STEP 4: Call AI for final verification + analysis ===
      console.log('Calling AI for resume analysis...');
      let result;
      try {
        result = await analyzeResumeWithAI(resumePrompt, '');
        console.log('AI result received:', JSON.stringify(result, null, 2));
      } catch (aiErr: any) {
        console.error('AI call failed:', aiErr);
        Alert.alert(
          'AI Analysis Failed',
          `Could not connect to AI service.\n\nDetails: ${aiErr?.message || aiErr}\n\nMake sure Groq API key is configured in config.ts or check your internet connection.`,
          [{ text: 'OK' }]
        );
        setIsUploading(false);
        return;
      }

      if (!result) {
        console.log('AI returned null/undefined');
        Alert.alert('Error', 'AI returned no response. Please try again.');
        setIsUploading(false);
        return;
      }

      if (!result.isResume) {
        Alert.alert('Not a Resume', result.warning || 'Could not detect a valid resume. Please upload your resume file.', [{ text: 'OK' }]);
        setIsUploading(false);
        return;
      }

      setAnalysisResult({
        overview: result.overview || 'Analysis complete.',
        score: result.score || 65,
        skillGaps: result.skillGaps?.length ? result.skillGaps : ['Add more specific technical skills', 'Quantify achievements'],
        feedback: result.feedback?.length ? result.feedback : ['Review formatting', 'Add metrics to achievements'],
        roadmap: result.roadmap?.length ? result.roadmap : ['Identify target role', 'Fill skill gaps', 'Build portfolio'],
      });
    } catch (error: any) {
      console.error('Analysis error - Full error object:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || String(error);
      Alert.alert(
        'Analysis Error',
        `Error: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BRAND_GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resume AI Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Upload your resume to receive personalized career insights and skill gap analysis.</Text>

        {!analysisResult ? (
          <View style={styles.uploadCard}>
            <Ionicons name="cloud-upload-outline" size={60} color={BRAND_GOLD} />
            <Text style={styles.uploadTitle}>Choose your file</Text>
            <Text style={styles.uploadSubtitle}>PDF or DOCX (Max 5MB)</Text>
            
            {selectedFile && !selectedFile.canceled && (
              <View style={styles.fileBadge}>
                <Ionicons name="document-text" size={16} color={BRAND_GOLD} />
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.assets[0].name}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
              <Text style={styles.pickButtonText}>{selectedFile ? 'Change File' : 'Select Resume'}</Text>
            </TouchableOpacity>

            {selectedFile && !selectedFile.canceled && (
              <TouchableOpacity 
                style={[styles.analyzeButton, isUploading && styles.analyzeButtonDisabled]} 
                onPress={uploadAndAnalyze}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color={BRAND_NAVY} size="small" />
                    <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  </View>
                ) : (
                  <Text style={styles.analyzeButtonText}>Start AI Analysis</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="sparkles" size={20} color={BRAND_GOLD} />
              <Text style={styles.resultTitle}>AI Insights</Text>
            </View>
            
            {/* 1. Combined AI Insight: Summary & ATS Writing Feedback */}
            <Text style={styles.resultText}>{renderFormattedText(analysisResult.overview)}</Text>

            <View style={[styles.atsContainer, { marginTop: 10 }]}>
              <Text style={styles.sectionHeader}>ATS Score & Writing Standards</Text>
              <View style={styles.scoreRow}>
                <View style={[styles.scorePill, { backgroundColor: analysisResult.score > 80 ? '#22c55e20' : '#eab30820' }]}>
                  <Text style={[styles.scoreValue, { color: analysisResult.score > 80 ? '#22c55e' : '#eab308' }]}>{analysisResult.score}/100</Text>
                </View>
                <Text style={styles.scoreLabel}>Industry Standard Match</Text>
              </View>
              {analysisResult.feedback?.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={BRAND_GOLD} />
                  <Text style={styles.bulletText}>{renderFormattedText(item)}</Text>
                </View>
              ))}
            </View>

            {/* 2. Skill Gaps Section */}
            {analysisResult.skillGaps.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionHeader}>Skill Gaps</Text>
                {analysisResult.skillGaps.map((gap, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Ionicons name="alert-circle-outline" size={14} color="#ff6b6b" />
                    <Text style={styles.bulletText}>{renderFormattedText(gap)}</Text>
                  </View>
                ))}
              </>
            )}

            {/* 4. Roadmap Section (Final Section) */}
            {analysisResult.roadmap.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionHeader}>Career Roadmap</Text>
                {analysisResult.roadmap.map((step, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Ionicons name="arrow-forward-circle-outline" size={14} color={BRAND_GOLD} />
                    <Text style={styles.bulletText}>{renderFormattedText(step)}</Text>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={() => {setAnalysisResult(null); setSelectedFile(null);}}>
              <Text style={styles.resetButtonText}>Upload Another Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={BRAND_GOLD} />
          <Text style={styles.infoText}>Our AI analyzes your experience against current market trends to suggest certifications and career paths.</Text>
        </View>
      </ScrollView>
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
  container: { 
    padding: 20 
  },
  subtitle: { 
    color: 'rgba(255,255,255,0.7)', 
    textAlign: 'center', 
    marginBottom: 30, 
    lineHeight: 22 
  },
  uploadCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,164,95,0.2)',
    borderStyle: 'dashed',
  },
  uploadTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  uploadSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, marginBottom: 20 },
  fileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,164,95,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
    maxWidth: '100%',
  },
  fileName: { color: BRAND_GOLD, fontSize: 13, marginLeft: 6 },
  pickButton: {
    borderWidth: 1,
    borderColor: BRAND_GOLD,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  pickButtonText: { color: BRAND_GOLD, fontWeight: '600' },
  analyzeButton: {
    backgroundColor: BRAND_GOLD,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#a08040',
  },
  analyzeButtonText: { color: BRAND_NAVY, fontWeight: 'bold', fontSize: 16 },
  resultCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,164,95,0.3)',
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  resultTitle: { color: BRAND_GOLD, fontSize: 18, fontWeight: 'bold' },
  resultText: { color: '#fff', fontSize: 15, lineHeight: 24, marginBottom: 10 },
  sectionHeader: { color: BRAND_GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 5, letterSpacing: 1 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bulletText: { color: '#fff', fontSize: 14, lineHeight: 20, flex: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  atsContainer: { backgroundColor: 'rgba(212,164,95,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(212,164,95,0.1)' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  resetButton: { marginTop: 20, alignSelf: 'center' },
  resetButtonText: { color: BRAND_GOLD, fontSize: 14, textDecorationLine: 'underline' },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
    gap: 12,
  },
  infoText: { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 },
});