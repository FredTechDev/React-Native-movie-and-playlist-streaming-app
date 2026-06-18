import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable, Image,
  ActivityIndicator, TextInput, useColorScheme, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Download, Heart, Share2, Plus, ArrowLeft,
  CheckCircle2, Star, Clock, Eye, ThumbsUp,
  MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { apiService } from '@/services/api';
import { downloadManager } from '@/services/downloadManager';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useAuthStore } from '@/store/useAuthStore';
import VideoPlayer from '@/components/VideoPlayer';
import { Video, Comment } from '@/types';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function WatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; isOffline?: string; localUri?: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user } = useAuthStore();
  const { tasks } = useDownloadStore();

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const taskId = `dl-${params.id}`;
  const downloadTask = tasks[taskId];
  const isOffline = params.isOffline === 'true' || downloadTask?.status === 'COMPLETED';
  const localUri = params.localUri || downloadTask?.localUri;

  useEffect(() => {
    const loadVideoData = async () => {
      setLoading(true);
      try {
        const item = await apiService.getVideoById(params.id);
        if (item) {
          setVideo(item);
          setLikeCount(item.likes);
          const recs = await apiService.getRecommendedVideos(item.genre);
          setRecommendations(recs.filter((r) => r.id !== item.id).slice(0, 8));
        }
        const commentsData = await apiService.getCommentsByVideoId(params.id);
        setComments(commentsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadVideoData();
  }, [params.id]);

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleShare = async () => {
    if (!video) return;
    try {
      await Share.share({
        message: `Watch "${video.title}" on Netstream!\n${video.videoUrl}`,
        title: video.title,
      });
    } catch (_) {}
  };

  const handleDownload = () => {
    if (!video) return;
    if (user?.role === 'GUEST') {
      alert('Sign in to download videos for offline viewing.');
      return;
    }
    downloadManager.startDownload(video.id, video.videoUrl, video.title, video.thumbnailUrl, 120 * 1024 * 1024);
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !video) return;
    setSubmittingComment(true);
    try {
      const activeUser = user || { id: 'guest', displayName: 'Guest User', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' };
      const newComment = await apiService.addComment(video.id, activeUser.id, activeUser.displayName, activeUser.avatarUrl, commentText);
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </ThemedView>
    );
  }

  if (!video) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="smallBold">Video not found</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="small" style={{ color: '#fff' }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Video Player */}
      <VideoPlayer video={video} isOffline={isOffline} offlineUri={localUri} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Meta */}
        <View style={styles.detailCard}>
          <ThemedText type="title" style={styles.title}>{video.title}</ThemedText>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Eye size={13} color={colors.textSecondary} />
              <ThemedText type="code" style={[styles.statText, { color: colors.textSecondary }]}>
                {formatViews(video.views)} views
              </ThemedText>
            </View>
            {video.duration > 0 && (
              <View style={styles.statItem}>
                <Clock size={13} color={colors.textSecondary} />
                <ThemedText type="code" style={[styles.statText, { color: colors.textSecondary }]}>
                  {formatDuration(video.duration)}
                </ThemedText>
              </View>
            )}
            {video.year && (
              <ThemedText type="code" style={[styles.statText, { color: colors.textSecondary }]}>
                {video.year}
              </ThemedText>
            )}
            {video.rating && (
              <View style={styles.ratingBadge}>
                <ThemedText type="code" style={styles.ratingText}>{video.rating}</ThemedText>
              </View>
            )}
            <View style={styles.resBadge}>
              <ThemedText type="code" style={styles.resBadgeText}>{video.resolution}</ThemedText>
            </View>
          </View>

          {/* Tier & Genre chips */}
          <View style={styles.chipRow}>
            <View style={[styles.tierChip, { backgroundColor: video.tier === 'PREMIUM' ? '#e1ad01' : video.tier === 'BASIC' ? '#1565c0' : '#333' }]}>
              <ThemedText type="code" style={styles.tierChipText}>{video.tier}</ThemedText>
            </View>
            <View style={styles.genreChip}>
              <ThemedText type="code" style={[styles.genreChipText, { color: colors.textSecondary }]}>{video.genre}</ThemedText>
            </View>
          </View>

          {/* Action Row */}
          <View style={[styles.actionRow, { borderColor: colors.backgroundElement }]}>
            <Pressable onPress={handleLike} style={styles.actionItem}>
              <Heart size={22} color={liked ? '#e50914' : colors.text} fill={liked ? '#e50914' : 'transparent'} />
              <ThemedText type="code" style={[styles.actionText, { color: liked ? '#e50914' : colors.textSecondary }]}>
                {formatViews(likeCount)}
              </ThemedText>
            </Pressable>

            {!downloadTask ? (
              <Pressable onPress={handleDownload} style={styles.actionItem}>
                <Download size={22} color={colors.text} />
                <ThemedText type="code" style={[styles.actionText, { color: colors.textSecondary }]}>Save</ThemedText>
              </Pressable>
            ) : downloadTask.status === 'COMPLETED' ? (
              <Pressable style={styles.actionItem}>
                <CheckCircle2 size={22} color="#00c853" />
                <ThemedText type="code" style={[styles.actionText, { color: '#00c853' }]}>Saved</ThemedText>
              </Pressable>
            ) : (
              <Pressable style={styles.actionItem}>
                <ActivityIndicator size="small" color="#e50914" />
                <ThemedText type="code" style={[styles.actionText, { color: '#e50914' }]}>{downloadTask.progress}%</ThemedText>
              </Pressable>
            )}

            <Pressable onPress={handleShare} style={styles.actionItem}>
              <Share2 size={22} color={colors.text} />
              <ThemedText type="code" style={[styles.actionText, { color: colors.textSecondary }]}>Share</ThemedText>
            </Pressable>

            <Pressable style={styles.actionItem}>
              <Plus size={22} color={colors.text} />
              <ThemedText type="code" style={[styles.actionText, { color: colors.textSecondary }]}>Watchlist</ThemedText>
            </Pressable>
          </View>

          {/* Creator Channel */}
          <View style={[styles.creatorChannel, { borderColor: colors.backgroundElement }]}>
            <Image source={{ uri: video.creatorAvatar }} style={styles.creatorAvatar} />
            <View style={styles.creatorMeta}>
              <ThemedText type="smallBold" style={{ fontSize: 14 }}>{video.creatorName}</ThemedText>
              <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 11 }}>124K subscribers</ThemedText>
            </View>
            <Pressable
              onPress={() => setSubscribed((v) => !v)}
              style={[styles.subBtn, { backgroundColor: subscribed ? colors.backgroundElement : colors.text }]}
            >
              <ThemedText type="code" style={{ color: subscribed ? colors.textSecondary : colors.background, fontWeight: '700', fontSize: 11 }}>
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Cast & Director */}
          {(video.director || (video.cast && video.cast.length > 0)) && (
            <View style={[styles.metaBox, { backgroundColor: colors.backgroundElement }]}>
              {video.director && (
                <View style={styles.metaBoxRow}>
                  <ThemedText type="code" style={[styles.metaLabel, { color: colors.textSecondary }]}>Director</ThemedText>
                  <ThemedText type="smallBold" style={styles.metaValue}>{video.director}</ThemedText>
                </View>
              )}
              {video.cast && video.cast.length > 0 && (
                <View style={styles.metaBoxRow}>
                  <ThemedText type="code" style={[styles.metaLabel, { color: colors.textSecondary }]}>Cast</ThemedText>
                  <ThemedText type="small" style={[styles.metaValue, { color: colors.textSecondary, flex: 1 }]} numberOfLines={2}>
                    {video.cast.join(', ')}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Description with expand/collapse */}
          <Pressable onPress={() => setDescExpanded((v) => !v)} style={[styles.descBox, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText type="small" style={{ color: colors.text, lineHeight: 19 }} numberOfLines={descExpanded ? undefined : 3}>
              {video.description}
            </ThemedText>
            <View style={styles.descToggle}>
              {descExpanded ? <ChevronUp size={14} color={colors.textSecondary} /> : <ChevronDown size={14} color={colors.textSecondary} />}
              <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 11 }}>
                {descExpanded ? 'Show less' : 'Show more'}
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionHeading}>More Like This</ThemedText>
            {recommendations.map((rec) => (
              <Pressable
                key={rec.id}
                onPress={() => router.push(`/watch/${rec.id}`)}
                style={[styles.recRow, { borderBottomColor: colors.backgroundElement }]}
              >
                <Image source={{ uri: rec.thumbnailUrl }} style={styles.recThumbnail} />
                <View style={styles.recDetails}>
                  <ThemedText type="smallBold" numberOfLines={2} style={{ fontSize: 13 }}>{rec.title}</ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                    {rec.creatorName}
                  </ThemedText>
                  <View style={styles.recMeta}>
                    <View style={[styles.recTierPill, { backgroundColor: rec.tier === 'PREMIUM' ? '#e1ad01' : '#333' }]}>
                      <ThemedText type="code" style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{rec.tier}</ThemedText>
                    </View>
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {formatViews(rec.views)} views
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Comments */}
        <View style={styles.section}>
          <View style={styles.commentsSectionHeader}>
            <MessageSquare size={16} color={colors.text} />
            <ThemedText type="smallBold" style={styles.sectionHeading}>
              Comments ({comments.length})
            </ThemedText>
          </View>

          <View style={styles.commentInputRow}>
            {user && <Image source={{ uri: user.avatarUrl }} style={styles.commentInputAvatar} />}
            <TextInput
              placeholder="Share your thoughts…"
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              style={[styles.commentField, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
              returnKeyType="send"
              onSubmitEditing={handlePostComment}
            />
            <Pressable
              onPress={handlePostComment}
              disabled={submittingComment || !commentText.trim()}
              style={[styles.commentPostBtn, { backgroundColor: commentText.trim() ? '#e50914' : colors.backgroundElement }]}
            >
              {submittingComment
                ? <ActivityIndicator size="small" color="#fff" />
                : <ThemedText type="code" style={{ color: commentText.trim() ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>Post</ThemedText>
              }
            </Pressable>
          </View>

          <View style={styles.commentsList}>
            {comments.map((comm) => (
              <View key={comm.id} style={styles.commentCard}>
                {comm.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <ThemedText type="code" style={styles.pinnedText}>📌 Pinned by creator</ThemedText>
                  </View>
                )}
                <View style={styles.commentHeader}>
                  <Image source={{ uri: comm.avatarUrl }} style={styles.commentAvatar} />
                  <View style={styles.commentUserMeta}>
                    <ThemedText type="smallBold" style={{ fontSize: 12 }}>{comm.username}</ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {new Date(comm.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={[styles.commentBody, { color: colors.text }]}>
                  {comm.content}
                </ThemedText>
                <View style={styles.commentActions}>
                  <Pressable style={styles.commentActionBtn}>
                    <ThumbsUp size={12} color={colors.textSecondary} />
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>{comm.likes}</ThemedText>
                  </Pressable>
                </View>

                {comm.replies && comm.replies.map((rep) => (
                  <View key={rep.id} style={[styles.replyCard, { backgroundColor: colors.backgroundElement }]}>
                    <View style={styles.commentHeader}>
                      <Image source={{ uri: rep.avatarUrl }} style={[styles.commentAvatar, { width: 24, height: 24, borderRadius: 12 }]} />
                      <ThemedText type="smallBold" style={{ fontSize: 12 }}>{rep.username}</ThemedText>
                    </View>
                    <ThemedText type="small" style={[styles.commentBody, { color: colors.text, paddingLeft: 32 }]}>
                      {rep.content}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two },
  backBtn: { paddingVertical: 8, paddingHorizontal: Spacing.three, backgroundColor: '#e50914', borderRadius: 4 },
  scrollContent: { paddingBottom: 48 },

  detailCard: { padding: Spacing.three, gap: Spacing.two },
  title: { fontSize: 20, fontWeight: '800', lineHeight: 26 },

  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11 },
  ratingBadge: {
    borderWidth: 1, borderColor: '#555',
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2,
  },
  ratingText: { fontSize: 9, fontWeight: '700', color: '#aaa' },
  resBadge: { backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  resBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  chipRow: { flexDirection: 'row', gap: 6 },
  tierChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tierChipText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  genreChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#333' },
  genreChipText: { fontSize: 10 },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.two, borderTopWidth: 1, borderBottomWidth: 1,
  },
  actionItem: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: 10 },

  creatorChannel: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  creatorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#333' },
  creatorMeta: { flex: 1 },
  subBtn: { paddingVertical: 7, paddingHorizontal: Spacing.three, borderRadius: 20 },

  metaBox: { borderRadius: 8, padding: Spacing.two, gap: 6 },
  metaBoxRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  metaLabel: { fontSize: 11, width: 60 },
  metaValue: { fontSize: 12, flex: 1 },

  descBox: { borderRadius: 8, padding: Spacing.two, gap: 4 },
  descToggle: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },

  section: { padding: Spacing.three, gap: Spacing.two },
  sectionHeading: { fontSize: 15, fontWeight: '800' },
  commentsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  recRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  recThumbnail: { width: 130, aspectRatio: 16 / 9, borderRadius: 6, backgroundColor: '#1a1a2e' },
  recDetails: { flex: 1, justifyContent: 'center', gap: 3 },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recTierPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },

  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 4 },
  commentInputAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333' },
  commentField: { flex: 1, height: 40, borderBottomWidth: 1, fontSize: 13, paddingBottom: 4 },
  commentPostBtn: { paddingVertical: 7, paddingHorizontal: Spacing.two, borderRadius: 6, minWidth: 44, alignItems: 'center' },

  commentsList: { gap: Spacing.three },
  commentCard: { gap: 6 },
  pinnedBadge: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(229,9,20,0.1)', borderRadius: 4, alignSelf: 'flex-start' },
  pinnedText: { color: '#e50914', fontSize: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333' },
  commentUserMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentBody: { paddingLeft: 38, fontSize: 13, lineHeight: 18 },
  commentActions: { paddingLeft: 38, flexDirection: 'row', gap: 12, marginTop: -2 },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyCard: { marginLeft: 38, marginTop: 4, padding: 8, borderRadius: 6, gap: 4 },
});
