import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable, Image,
  ActivityIndicator, TextInput, useColorScheme, Share, FlatList,
  Dimensions, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Download, Heart, Share2, Plus, ArrowLeft,
  CheckCircle2, Star, Clock, Eye, ThumbsUp,
  MessageSquare, ChevronDown, ChevronUp, Play,
  Film, Languages, Volume2, Subtitles,
  ChevronRight, List,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = 110;
const CAST_ITEM_WIDTH = 80;

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StarRating({ rating, size = 14 }: { rating?: string; size?: number }) {
  const starCount = rating === 'R' ? 4 : rating === 'PG-13' ? 3 : rating === 'PG' ? 2 : rating === 'G' ? 1 : 3;
  return (
    <View style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          color={s <= starCount ? '#e1ad01' : '#333'}
          fill={s <= starCount ? '#e1ad01' : 'transparent'}
        />
      ))}
    </View>
  );
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
  const [inWatchlist, setInWatchlist] = useState(false);
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
          setInWatchlist(apiService.isInWatchlist(item.id));
          const recs = await apiService.getRecommendedVideos(item.genre);
          setRecommendations(recs.filter((r) => r.id !== item.id).slice(0, 12));
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

  const handleWatchlist = async () => {
    if (!video) return;
    if (inWatchlist) {
      await apiService.removeFromWatchlist(video.id);
    } else {
      await apiService.addToWatchlist(video.id);
    }
    setInWatchlist((v) => !v);
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

  const renderCastItem = useCallback(({ item }: { item: string }) => (
    <View style={styles.castItem}>
      <View style={styles.castAvatarCircle}>
        <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 18 }}>
          {item.charAt(0)}
        </ThemedText>
      </View>
      <ThemedText type="code" style={styles.castName} numberOfLines={2}>
        {item}
      </ThemedText>
    </View>
  ), []);

  const renderRecItem = useCallback(({ item }: { item: Video }) => (
    <Pressable
      key={item.id}
      onPress={() => router.push(`/watch/${item.id}`)}
      style={styles.recCard}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.recPoster} />
      {item.tier !== 'FREE' && (
        <View style={[styles.recTierBadge, { backgroundColor: item.tier === 'PREMIUM' ? '#e1ad01' : '#1565c0' }]}>
          <ThemedText type="code" style={styles.recTierText}>{item.tier}</ThemedText>
        </View>
      )}
      <ThemedText type="smallBold" style={styles.recTitle} numberOfLines={1}>
        {item.title}
      </ThemedText>
      <ThemedText type="code" style={styles.recMeta}>
        {item.genre} · {formatViews(item.views)} views
      </ThemedText>
    </Pressable>
  ), [router]);

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Video Player */}
        <VideoPlayer video={video} isOffline={isOffline} offlineUri={localUri} />

        {/* Hero Info Section */}
        <View style={styles.heroSection}>
          {/* Poster + Key Info Row */}
          <View style={styles.posterRow}>
            <Image
              source={{ uri: video.posterUrl || video.thumbnailUrl }}
              style={styles.posterImage}
            />
            <View style={styles.heroInfo}>
              <ThemedText type="title" style={styles.movieTitle}>{video.title}</ThemedText>

              <View style={styles.heroMetaRow}>
                {video.year && (
                  <ThemedText type="small" style={[styles.heroMetaText, { color: colors.textSecondary }]}>
                    {video.year}
                  </ThemedText>
                )}
                {video.rating && (
                  <View style={styles.heroRatingBadge}>
                    <ThemedText type="code" style={styles.heroRatingText}>{video.rating}</ThemedText>
                  </View>
                )}
                {video.duration > 0 && (
                  <ThemedText type="small" style={[styles.heroMetaText, { color: colors.textSecondary }]}>
                    {formatDuration(video.duration)}
                  </ThemedText>
                )}
                <View style={[styles.heroResBadge, { backgroundColor: video.tier === 'PREMIUM' ? '#e1ad01' : '#333' }]}>
                  <ThemedText type="code" style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                    {video.resolution}
                  </ThemedText>
                </View>
              </View>

              <StarRating rating={video.rating} size={12} />

              <View style={styles.heroStatsRow}>
                <Eye size={12} color={colors.textSecondary} />
                <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                  {formatViews(video.views)} views
                </ThemedText>
                <View style={styles.dot} />
                <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                  {video.genre}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <Pressable onPress={handleLike} style={styles.actionBtn}>
              <Heart size={20} color={liked ? '#e50914' : colors.text} fill={liked ? '#e50914' : 'transparent'} />
              <ThemedText type="code" style={[styles.actionBtnText, { color: liked ? '#e50914' : colors.textSecondary }]}>
                {formatViews(likeCount)}
              </ThemedText>
            </Pressable>

            <Pressable onPress={handleDownload} style={styles.actionBtn}>
              {!downloadTask ? (
                <>
                  <Download size={20} color={colors.text} />
                  <ThemedText type="code" style={[styles.actionBtnText, { color: colors.textSecondary }]}>Download</ThemedText>
                </>
              ) : downloadTask.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 size={20} color="#00c853" />
                  <ThemedText type="code" style={[styles.actionBtnText, { color: '#00c853' }]}>Saved</ThemedText>
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color="#e50914" />
                  <ThemedText type="code" style={[styles.actionBtnText, { color: '#e50914' }]}>{downloadTask.progress}%</ThemedText>
                </>
              )}
            </Pressable>

            <Pressable onPress={handleWatchlist} style={styles.actionBtn}>
              <Plus size={20} color={inWatchlist ? '#e50914' : colors.text} />
              <ThemedText type="code" style={[styles.actionBtnText, { color: inWatchlist ? '#e50914' : colors.textSecondary }]}>
                {inWatchlist ? 'In List' : 'My List'}
              </ThemedText>
            </Pressable>

            <Pressable onPress={handleShare} style={styles.actionBtn}>
              <Share2 size={20} color={colors.text} />
              <ThemedText type="code" style={[styles.actionBtnText, { color: colors.textSecondary }]}>Share</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Pressable onPress={() => setDescExpanded((v) => !v)}>
            <ThemedText
              type="small"
              style={{ color: colors.text, lineHeight: 20 }}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {video.description}
            </ThemedText>
            <View style={styles.descToggle}>
              <ThemedText type="code" style={{ color: colors.accent, fontSize: 11 }}>
                {descExpanded ? 'Show less' : 'Read more'}
              </ThemedText>
              {descExpanded ? <ChevronUp size={12} color={colors.accent} /> : <ChevronDown size={12} color={colors.accent} />}
            </View>
          </Pressable>
        </View>

        {/* Cast */}
        {video.cast && video.cast.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>Cast</ThemedText>
            </View>
            <FlatList
              data={video.cast}
              renderItem={renderCastItem}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castList}
            />
            {video.director && (
              <View style={styles.directorRow}>
                <Film size={14} color={colors.textSecondary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Directed by <ThemedText type="smallBold" style={{ color: colors.text, fontSize: 12 }}>{video.director}</ThemedText>
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Info Grid */}
        <View style={[styles.infoGrid, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Genre</ThemedText>
            <ThemedText type="smallBold" style={styles.infoValue}>{video.genre}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Release</ThemedText>
            <ThemedText type="smallBold" style={styles.infoValue}>{video.year || '—'}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</ThemedText>
            <ThemedText type="smallBold" style={styles.infoValue}>{formatDuration(video.duration)}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Quality</ThemedText>
            <ThemedText type="smallBold" style={styles.infoValue}>{video.resolution}</ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Rating</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={styles.heroRatingBadge}>
                <ThemedText type="code" style={styles.heroRatingText}>{video.rating || '—'}</ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.infoItem}>
            <ThemedText type="code" style={[styles.infoLabel, { color: colors.textSecondary }]}>Tier</ThemedText>
            <View style={[styles.tierPill, { backgroundColor: video.tier === 'PREMIUM' ? '#e1ad01' : video.tier === 'BASIC' ? '#1565c0' : '#555' }]}>
              <ThemedText type="code" style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{video.tier}</ThemedText>
            </View>
          </View>
        </View>

        {/* Available In */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <List size={15} color={colors.textSecondary} />
            <ThemedText type="smallBold" style={styles.sectionTitle}>Available In</ThemedText>
          </View>
          <View style={styles.availRow}>
            <View style={styles.availChip}>
              <Volume2 size={12} color={colors.textSecondary} />
              <ThemedText type="code" style={styles.availChipText}>English 5.1</ThemedText>
            </View>
            <View style={styles.availChip}>
              <Subtitles size={12} color={colors.textSecondary} />
              <ThemedText type="code" style={styles.availChipText}>English (CC)</ThemedText>
            </View>
            <View style={styles.availChip}>
              <Languages size={12} color={colors.textSecondary} />
              <ThemedText type="code" style={styles.availChipText}>Español, Français</ThemedText>
            </View>
          </View>
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
            <ThemedText type="code" style={{
              color: subscribed ? colors.textSecondary : colors.background,
              fontWeight: '700', fontSize: 11,
            }}>
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </ThemedText>
          </Pressable>
        </View>

        {/* More Like This */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>More Like This</ThemedText>
              <ChevronRight size={14} color={colors.textSecondary} />
            </View>
            <FlatList
              data={recommendations}
              renderItem={renderRecItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recList}
            />
          </View>
        )}

        {/* Comments */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 4 }]}>
            <MessageSquare size={15} color={colors.textSecondary} />
            <ThemedText type="smallBold" style={styles.sectionTitle}>
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
              style={[styles.commentField, { color: colors.text, borderColor: colors.backgroundElement }]}
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
                : <ThemedText type="code" style={{
                    color: commentText.trim() ? '#fff' : colors.textSecondary,
                    fontWeight: '700', fontSize: 12,
                  }}>
                    Post
                  </ThemedText>
              }
            </Pressable>
          </View>

          <View style={styles.commentsList}>
            {comments.map((comm) => (
              <View key={comm.id} style={styles.commentCard}>
                {comm.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <ThemedText type="code" style={styles.pinnedText}>Pinned by creator</ThemedText>
                  </View>
                )}
                <View style={styles.commentHeader}>
                  <Image source={{ uri: comm.avatarUrl }} style={styles.commentAvatar} />
                  <View style={styles.commentUserMeta}>
                    <ThemedText type="smallBold" style={{ fontSize: 12 }}>{comm.username}</ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {formatDate(comm.createdAt)}
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
                      <Image source={{ uri: rep.avatarUrl }} style={[styles.commentAvatar, { width: 22, height: 22, borderRadius: 11 }]} />
                      <ThemedText type="smallBold" style={{ fontSize: 11 }}>{rep.username}</ThemedText>
                    </View>
                    <ThemedText type="small" style={[styles.commentBody, { color: colors.text, paddingLeft: 28 }]}>
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

  // Hero Section
  heroSection: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  posterRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_WIDTH * 1.5,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 12,
  },
  heroRatingBadge: {
    borderWidth: 1,
    borderColor: '#555',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  heroRatingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#aaa',
  },
  heroResBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#555',
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: { fontSize: 10 },

  // Section
  section: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Description
  descToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },

  // Cast
  castList: {
    gap: Spacing.three,
    paddingRight: Spacing.three,
  },
  castItem: {
    width: CAST_ITEM_WIDTH,
    alignItems: 'center',
    gap: 4,
  },
  castAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  castName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#aaa',
  },
  directorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Spacing.three,
    borderRadius: 10,
    padding: Spacing.two,
    gap: 0,
  },
  infoItem: {
    width: '33.33%',
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    gap: 3,
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },

  // Available In
  availRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  availChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1a1a25',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  availChipText: {
    fontSize: 10,
    color: '#aaa',
  },

  // Creator Channel
  creatorChannel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  creatorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#333' },
  creatorMeta: { flex: 1 },
  subBtn: { paddingVertical: 7, paddingHorizontal: Spacing.three, borderRadius: 20 },

  // Recommendations
  recList: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  recCard: {
    width: 130,
    gap: 4,
  },
  recPoster: {
    width: 130,
    aspectRatio: 16 / 9,
    borderRadius: 6,
    backgroundColor: '#1a1a2e',
  },
  recTierBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  recTierText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  recTitle: {
    fontSize: 12,
  },
  recMeta: {
    fontSize: 9,
    color: '#888',
  },

  // Comments
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 4,
  },
  commentInputAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333' },
  commentField: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentPostBtn: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  commentsList: { gap: Spacing.three },
  commentCard: { gap: 6 },
  pinnedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(229,9,20,0.1)',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pinnedText: { color: '#e50914', fontSize: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333' },
  commentUserMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentBody: { paddingLeft: 38, fontSize: 13, lineHeight: 18 },
  commentActions: { paddingLeft: 38, flexDirection: 'row', gap: 12, marginTop: -2 },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyCard: { marginLeft: 38, marginTop: 4, padding: 8, borderRadius: 6, gap: 4 },
});
