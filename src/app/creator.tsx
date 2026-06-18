import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, ActivityIndicator, useColorScheme, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, Film, Radio, Plus, Settings, TrendingUp, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import { apiService } from '../services/api';
import AnalyticsView from '../components/AnalyticsView';
import { CreatorAnalytics } from '../types';

const uploadSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(5, 'Description is too short'),
  genre: z.string().min(2, 'Enter a genre (e.g. Sci-Fi)'),
  tier: z.enum(['FREE', 'BASIC', 'PREMIUM'])
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function CreatorScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user, updateRole } = useAuthStore();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [tab, setTab] = useState<'analytics' | 'upload' | 'live'>('analytics');

  // Upload/Live state
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: '', description: '', genre: '', tier: 'FREE' }
  });

  useEffect(() => {
    if (user && (user.role === 'CREATOR' || user.role === 'ADMIN')) {
      const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
          const stats = await apiService.getCreatorAnalytics(user.id);
          setAnalytics(stats);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingAnalytics(false);
        }
      };
      fetchAnalytics();
    }
  }, [user]);

  const handleBecomeCreator = () => {
    updateRole('CREATOR');
  };

  const handleUploadSubmit = async (data: UploadFormValues) => {
    setUploading(true);
    setUploadSuccess(false);
    try {
      // Simulate file upload (NestJS backend API simulation)
      await apiService.uploadVideo(
        data.title,
        data.description,
        data.genre,
        data.tier,
        'mock_video_uri.mp4',
        'mock_thumbnail_uri.jpg'
      );
      setUploadSuccess(true);
      reset();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleStartLive = async () => {
    if (!liveTitle.trim()) return;
    setLiveLoading(true);
    try {
      // Simulate broadcasting handshake
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowLiveModal(false);
      
      // Navigate to live viewer
      router.push(`/live/live-stream-01`);
    } catch {
      setLiveLoading(false);
    } finally {
      setLiveLoading(false);
    }
  };

  // If user is a Regular Guest/User, show onboarding become creator first
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return (
      <ThemedView style={styles.onboardContainer}>
        <Sparkles size={64} color="#e50914" />
        <ThemedText type="title" style={styles.onboardTitle}>
          Creator Studio
        </ThemedText>
        <ThemedText type="small" style={styles.onboardDesc}>
          Upload high-fidelity videos, manage playlists, view analytics dashboards, and stream live to your subscribers.
        </ThemedText>
        <Pressable onPress={handleBecomeCreator} style={styles.onboardButton}>
          <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
            Become a Creator
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Tab select bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.backgroundElement }]}>
        <Pressable onPress={() => setTab('analytics')} style={[styles.tabBtn, tab === 'analytics' && styles.activeTab]}>
          <TrendingUp size={16} color={tab === 'analytics' ? '#e50914' : colors.textSecondary} />
          <ThemedText type="smallBold" style={{ color: tab === 'analytics' ? '#e50914' : colors.textSecondary }}>
            Analytics
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => setTab('upload')} style={[styles.tabBtn, tab === 'upload' && styles.activeTab]}>
          <Plus size={16} color={tab === 'upload' ? '#e50914' : colors.textSecondary} />
          <ThemedText type="smallBold" style={{ color: tab === 'upload' ? '#e50914' : colors.textSecondary }}>
            Upload
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => setTab('live')} style={[styles.tabBtn, tab === 'live' && styles.activeTab]}>
          <Radio size={16} color={tab === 'live' ? '#e50914' : colors.textSecondary} />
          <ThemedText type="smallBold" style={{ color: tab === 'live' ? '#e50914' : colors.textSecondary }}>
            Go Live
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render Tab Contents */}
        {tab === 'analytics' && (
          <View>
            {loadingAnalytics ? (
              <ActivityIndicator size="large" color="#e50914" style={{ marginTop: 40 }} />
            ) : (
              analytics && <AnalyticsView analytics={analytics} />
            )}
          </View>
        )}

        {tab === 'upload' && (
          <View style={styles.formContainer}>
            <ThemedText type="smallBold" style={styles.formSectionTitle}>
              Upload Video
            </ThemedText>

            {uploadSuccess && (
              <View style={styles.uploadSuccessCard}>
                <ThemedText type="smallBold" style={{ color: '#4caf50' }}>
                  Video uploaded successfully! It is now processing formats (4K, HLS, DASH).
                </ThemedText>
              </View>
            )}

            <View style={styles.formField}>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Video Title"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.title && <ThemedText type="code" style={styles.fieldError}>{errors.title.message}</ThemedText>}
            </View>

            <View style={styles.formField}>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Video Description"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.description && <ThemedText type="code" style={styles.fieldError}>{errors.description.message}</ThemedText>}
            </View>

            <View style={styles.formField}>
              <Controller
                control={control}
                name="genre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Genre (e.g. Comedy, Fantasy, Sci-Fi)"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.genre && <ThemedText type="code" style={styles.fieldError}>{errors.genre.message}</ThemedText>}
            </View>

            <View style={styles.formField}>
              <ThemedText type="smallBold" style={{ marginBottom: 4 }}>Select Monetization Tier</ThemedText>
              <View style={styles.tierSelectRow}>
                {['FREE', 'BASIC', 'PREMIUM'].map((t) => (
                  <Controller
                    key={t}
                    control={control}
                    name="tier"
                    render={({ field: { onChange, value } }) => (
                      <Pressable
                        onPress={() => onChange(t)}
                        style={[
                          styles.tierBtn,
                          value === t && styles.activeTierBtn,
                          { backgroundColor: colors.backgroundElement }
                        ]}
                      >
                        <ThemedText type="code" style={{ color: value === t ? '#ffffff' : colors.textSecondary }}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    )}
                  />
                ))}
              </View>
            </View>

            {/* Select Media placeholder */}
            <View style={[styles.selectMediaCard, { backgroundColor: colors.backgroundElement }]}>
              <ImageIcon size={24} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Video & Thumbnail selected (simulated)
              </ThemedText>
            </View>

            <Pressable 
              onPress={handleSubmit(handleUploadSubmit)} 
              style={[styles.submitBtn, { backgroundColor: '#e50914' }]}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.uploadProgressRow}>
                  <ActivityIndicator color="#ffffff" />
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Uploading 48%...</ThemedText>
                </View>
              ) : (
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Upload to Netstream CDN</ThemedText>
              )}
            </Pressable>
          </View>
        )}

        {tab === 'live' && (
          <View style={styles.liveDashboard}>
            <Radio size={48} color="#e50914" />
            <ThemedText type="smallBold" style={styles.liveTitle}>Go Live Broadcasting</ThemedText>
            <ThemedText type="small" style={styles.liveDesc}>
              Stream live video feeds to millions of active subscribers with ultra low-latency WebRTC streams.
            </ThemedText>
            <Pressable onPress={() => setShowLiveModal(true)} style={[styles.submitBtn, { backgroundColor: '#e50914' }]}>
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Set Up Broadcast</ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Broadcast configurations Modal */}
      <Modal
        visible={showLiveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLiveModal(false)}
      >
        <View style={styles.modalBg}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <ThemedText type="smallBold" style={styles.modalHeading}>Configure Live Stream</ThemedText>
            <TextInput
              placeholder="Stream Title (e.g. Live Q&A and coding!)"
              placeholderTextColor={colors.textSecondary}
              value={liveTitle}
              onChangeText={setLiveTitle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowLiveModal(false)} style={styles.modalCancelBtn}>
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleStartLive} style={[styles.modalStartBtn, { backgroundColor: '#e50914' }]}>
                {liveLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Start Live</ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  onboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  onboardTitle: {
    fontSize: 24,
  },
  onboardDesc: {
    textAlign: 'center',
    color: '#888888',
    paddingHorizontal: Spacing.three,
  },
  onboardButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: 8,
    backgroundColor: '#e50914',
    marginTop: Spacing.two,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#e50914',
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  formContainer: {
    gap: Spacing.three,
  },
  formSectionTitle: {
    fontSize: 18,
  },
  uploadSuccessCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4caf50',
    padding: Spacing.two,
    borderRadius: 6,
  },
  formField: {
    gap: 6,
  },
  input: {
    height: 48,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: Spacing.two,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 9,
  },
  tierSelectRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tierBtn: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTierBtn: {
    backgroundColor: '#e50914',
  },
  selectMediaCard: {
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  uploadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDashboard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: Spacing.two,
  },
  liveTitle: {
    fontSize: 18,
    marginTop: Spacing.one,
  },
  liveDesc: {
    textAlign: 'center',
    color: '#888888',
    paddingHorizontal: Spacing.four,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    padding: Spacing.four,
    borderRadius: 8,
    gap: Spacing.three,
  },
  modalHeading: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  modalStartBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
