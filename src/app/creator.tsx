import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TextInput, Pressable, ScrollView,
  ActivityIndicator, useColorScheme, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Radio, Plus, TrendingUp, Image as ImageIcon, Sparkles,
  DollarSign, Eye, Users, Clock, ChevronRight, Play,
} from 'lucide-react-native';
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
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is too short'),
  genre: z.string().min(2, 'Enter a valid genre (e.g. Sci-Fi)'),
  tier: z.enum(['FREE', 'BASIC', 'PREMIUM']),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      {icon}
      <ThemedText type="smallBold" style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText type="code" style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

export default function CreatorScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user, updateRole } = useAuthStore();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [tab, setTab] = useState<'analytics' | 'upload' | 'live'>('analytics');

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveCategory, setLiveCategory] = useState('Gaming');
  const [liveLoading, setLiveLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: '', description: '', genre: '', tier: 'FREE' },
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

  const handleUploadSubmit = async (data: UploadFormValues) => {
    setUploading(true);
    setUploadSuccess(false);
    setUploadProgress(0);

    // Simulate progressive upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) { clearInterval(interval); return 95; }
        return prev + Math.floor(Math.random() * 12 + 3);
      });
    }, 200);

    try {
      await apiService.uploadVideo(data.title, data.description, data.genre, data.tier, 'mock_video.mp4', 'mock_thumb.jpg');
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadSuccess(true);
        setUploading(false);
        reset();
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      console.error('Upload error:', err);
      setUploading(false);
    }
  };

  const handleStartLive = async () => {
    if (!liveTitle.trim()) return;
    setLiveLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowLiveModal(false);
      router.push('/live/live-stream-01');
    } finally {
      setLiveLoading(false);
    }
  };

  // Onboarding for non-creators
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return (
      <ThemedView style={styles.onboardContainer}>
        <View style={styles.onboardIcon}>
          <Sparkles size={40} color="#e1ad01" fill="#e1ad01" />
        </View>
        <ThemedText type="title" style={styles.onboardTitle}>Creator Studio</ThemedText>
        <ThemedText type="small" style={[styles.onboardDesc, { color: colors.textSecondary }]}>
          Upload films in 4K, go live to millions, manage playlists, and monetize your content.
        </ThemedText>

        <View style={styles.onboardFeatures}>
          {[
            { icon: <Eye size={16} color="#e50914" />, text: 'Reach millions of viewers globally' },
            { icon: <DollarSign size={16} color="#00c853" />, text: 'Earn from subscriptions & super chats' },
            { icon: <TrendingUp size={16} color="#e1ad01" />, text: 'Real-time analytics & performance data' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.onboardFeatureItem}>
              {icon}
              <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>{text}</ThemedText>
            </View>
          ))}
        </View>

        <Pressable onPress={() => updateRole('CREATOR')} style={styles.onboardButton}>
          <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 15 }}>Become a Creator</ThemedText>
          <ChevronRight size={18} color="#fff" />
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.backgroundElement }]}>
        {[
          { key: 'analytics', label: 'Analytics', icon: <TrendingUp size={15} /> },
          { key: 'upload', label: 'Upload', icon: <Plus size={15} /> },
          { key: 'live', label: 'Go Live', icon: <Radio size={15} /> },
        ].map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key as any)}
              style={[styles.tabBtn, active && styles.activeTab]}
            >
              {React.cloneElement(icon as any, { color: active ? '#e50914' : colors.textSecondary })}
              <ThemedText type="code" style={{ color: active ? '#e50914' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Analytics Tab ──────────────────────────────────── */}
        {tab === 'analytics' && (
          <View>
            {loadingAnalytics ? (
              <ActivityIndicator size="large" color="#e50914" style={{ marginTop: 60 }} />
            ) : analytics ? (
              <>
                {/* Quick stats grid */}
                <View style={styles.statsGrid}>
                  <StatCard
                    icon={<Users size={20} color="#e50914" />}
                    value={`${(analytics.subscribersCount / 1000).toFixed(1)}K`}
                    label="Subscribers"
                    color="#e50914"
                  />
                  <StatCard
                    icon={<Eye size={20} color="#e1ad01" />}
                    value={`${(analytics.totalViews / 1_000_000).toFixed(1)}M`}
                    label="Total Views"
                    color="#e1ad01"
                  />
                  <StatCard
                    icon={<DollarSign size={20} color="#00c853" />}
                    value={`$${analytics.monthlyRevenue.toFixed(0)}`}
                    label="Monthly Revenue"
                    color="#00c853"
                  />
                  <StatCard
                    icon={<Clock size={20} color="#42a5f5" />}
                    value={`${(analytics.watchTimeHours / 1000).toFixed(0)}K`}
                    label="Watch Hours"
                    color="#42a5f5"
                  />
                </View>
                <AnalyticsView analytics={analytics} />
              </>
            ) : null}
          </View>
        )}

        {/* ── Upload Tab ─────────────────────────────────────── */}
        {tab === 'upload' && (
          <View style={styles.formContainer}>
            <ThemedText type="smallBold" style={styles.formTitle}>Upload New Video</ThemedText>
            <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 12 }}>
              Your video will be transcoded to HLS/DASH in 4K, 1080p, 720p automatically.
            </ThemedText>

            {uploadSuccess && (
              <View style={styles.successCard}>
                <ThemedText type="smallBold" style={{ color: '#00c853', fontSize: 13 }}>
                  ✅ Video uploaded! Processing in 4K HLS/DASH — usually 5–10 minutes.
                </ThemedText>
              </View>
            )}

            {/* Title */}
            <View style={styles.formField}>
              <ThemedText type="code" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Video Title *</ThemedText>
              <Controller
                control={control} name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="e.g. My African Safari Documentary"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur} onChangeText={onChange} value={value}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.title && <ThemedText type="code" style={styles.fieldError}>{errors.title.message}</ThemedText>}
            </View>

            {/* Description */}
            <View style={styles.formField}>
              <ThemedText type="code" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description *</ThemedText>
              <Controller
                control={control} name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Describe your video for discoverability…"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur} onChangeText={onChange} value={value}
                    multiline numberOfLines={4}
                    style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.description && <ThemedText type="code" style={styles.fieldError}>{errors.description.message}</ThemedText>}
            </View>

            {/* Genre */}
            <View style={styles.formField}>
              <ThemedText type="code" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Genre *</ThemedText>
              <Controller
                control={control} name="genre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="e.g. Sci-Fi, Documentary, Comedy"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur} onChangeText={onChange} value={value}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement }]}
                  />
                )}
              />
              {errors.genre && <ThemedText type="code" style={styles.fieldError}>{errors.genre.message}</ThemedText>}
            </View>

            {/* Tier Selector */}
            <View style={styles.formField}>
              <ThemedText type="code" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Monetization Tier</ThemedText>
              <View style={styles.tierRow}>
                {(['FREE', 'BASIC', 'PREMIUM'] as const).map((t) => (
                  <Controller key={t} control={control} name="tier"
                    render={({ field: { onChange, value } }) => (
                      <Pressable
                        onPress={() => onChange(t)}
                        style={[styles.tierBtn, { backgroundColor: value === t ? '#e50914' : colors.backgroundElement }]}
                      >
                        <ThemedText type="code" style={{ color: value === t ? '#fff' : colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    )}
                  />
                ))}
              </View>
            </View>

            {/* Media Picker Placeholder */}
            <View style={[styles.mediaPicker, { backgroundColor: colors.backgroundElement }]}>
              <ImageIcon size={28} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }}>Tap to select video & thumbnail</ThemedText>
              <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>MP4, MOV · Max 10GB</ThemedText>
            </View>

            {/* Upload Progress */}
            {uploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
                </View>
                <ThemedText type="code" style={{ color: '#e50914', fontSize: 12, textAlign: 'center' }}>
                  Uploading… {uploadProgress}%
                </ThemedText>
              </View>
            )}

            <Pressable
              onPress={handleSubmit(handleUploadSubmit)}
              style={[styles.submitBtn, { backgroundColor: uploading ? '#555' : '#e50914' }]}
              disabled={uploading}
            >
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>
                {uploading ? `Uploading ${uploadProgress}%…` : 'Upload to Netstream CDN'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* ── Go Live Tab ────────────────────────────────────── */}
        {tab === 'live' && (
          <View style={styles.liveDashboard}>
            <View style={styles.liveIconWrapper}>
              <Radio size={44} color="#e50914" />
              <View style={styles.livePingDot} />
            </View>
            <ThemedText type="title" style={{ fontSize: 22, fontWeight: '900' }}>Go Live</ThemedText>
            <ThemedText type="small" style={[styles.liveDesc, { color: colors.textSecondary }]}>
              Broadcast live video to your subscribers with ultra-low latency WebRTC streams. Monetize with Super Chats.
            </ThemedText>

            <View style={styles.liveFeatures}>
              {[
                '⚡ Sub-500ms ultra-low latency',
                '💬 Real-time live chat & super chats',
                '📊 Live viewer analytics dashboard',
                '🎬 Auto-archive replay for VOD',
              ].map((f) => (
                <ThemedText key={f} type="code" style={[styles.liveFeatureItem, { color: colors.textSecondary }]}>{f}</ThemedText>
              ))}
            </View>

            <Pressable onPress={() => setShowLiveModal(true)} style={styles.submitBtn}>
              <Radio size={18} color="#fff" />
              <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 14 }}>Set Up Broadcast</ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Live Config Modal */}
      <Modal visible={showLiveModal} animationType="slide" transparent onRequestClose={() => setShowLiveModal(false)}>
        <View style={styles.modalBg}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Radio size={20} color="#e50914" />
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>Configure Live Broadcast</ThemedText>
            </View>

            <TextInput
              placeholder="Stream Title (e.g. Live Q&A + Coding!)"
              placeholderTextColor={colors.textSecondary}
              value={liveTitle} onChangeText={setLiveTitle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
            />

            <View style={styles.formField}>
              <ThemedText type="code" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</ThemedText>
              <View style={styles.tierRow}>
                {['Gaming', 'Music', 'IRL', 'Coding', 'Education'].map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setLiveCategory(cat)}
                    style={[styles.tierBtn, { backgroundColor: liveCategory === cat ? '#e50914' : colors.backgroundSelected, flex: 0, paddingHorizontal: 12 }]}
                  >
                    <ThemedText type="code" style={{ color: liveCategory === cat ? '#fff' : colors.textSecondary, fontSize: 11 }}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowLiveModal(false)} style={styles.modalCancel}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleStartLive} style={[styles.modalStart, { backgroundColor: '#e50914' }]}>
                {liveLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <ThemedText type="smallBold" style={{ color: '#fff' }}>▶ Go Live Now</ThemedText>
                }
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.three, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three },

  // Onboarding
  onboardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  onboardIcon: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(225,173,1,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(225,173,1,0.3)',
  },
  onboardTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  onboardDesc: { textAlign: 'center', lineHeight: 20, fontSize: 13 },
  onboardFeatures: { gap: 12, alignSelf: 'stretch', marginTop: 4 },
  onboardFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onboardButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e50914', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 10, marginTop: 8,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  statCard: {
    flex: 1, minWidth: '45%', padding: Spacing.two, borderRadius: 10,
    borderLeftWidth: 3, backgroundColor: 'rgba(255,255,255,0.04)', gap: 2,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#888' },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.two + 4,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  activeTab: { borderBottomWidth: 2.5, borderBottomColor: '#e50914' },

  // Form
  formContainer: { gap: Spacing.three },
  formTitle: { fontSize: 18, fontWeight: '900' },
  formField: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 48, borderRadius: 8, paddingHorizontal: Spacing.three, fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top', paddingVertical: Spacing.two },
  fieldError: { color: '#f44336', fontSize: 10 },
  tierRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  tierBtn: { flex: 1, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mediaPicker: {
    height: 90, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#444',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  progressContainer: { gap: 8 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#333', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e50914' },
  submitBtn: {
    height: 52, borderRadius: 10, backgroundColor: '#e50914',
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8,
  },
  successCard: {
    padding: Spacing.two, borderRadius: 8,
    backgroundColor: 'rgba(0,200,83,0.08)',
    borderWidth: 1, borderColor: '#00c853',
  },

  // Live
  liveDashboard: { alignItems: 'center', paddingTop: 24, gap: Spacing.two },
  liveIconWrapper: { position: 'relative', marginBottom: 8 },
  livePingDot: {
    position: 'absolute', top: 0, right: -2, width: 12, height: 12,
    borderRadius: 6, backgroundColor: '#e50914', borderWidth: 2, borderColor: '#0a0a0f',
  },
  liveDesc: { textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  liveFeatures: { gap: 8, alignSelf: 'stretch', paddingHorizontal: 8, marginTop: 8 },
  liveFeatureItem: { fontSize: 12, lineHeight: 20 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { padding: Spacing.four, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  modalCancel: { paddingVertical: 12, paddingHorizontal: Spacing.three },
  modalStart: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 130 },
});
