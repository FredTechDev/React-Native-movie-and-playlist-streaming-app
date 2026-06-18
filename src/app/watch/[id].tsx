import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Image, ActivityIndicator, TextInput, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download, Heart, Share2, Plus, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { apiService } from '@/services/api';
import { downloadManager } from '@/services/downloadManager';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useAuthStore } from '@/store/useAuthStore';
import VideoPlayer from '@/components/VideoPlayer';
import { Video, Comment } from '@/types';

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
  
  // Comment typing state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const taskId = `dl-${params.id}`;
  const downloadTask = tasks[taskId];
  const isOffline = params.isOffline === 'true' || (downloadTask?.status === 'COMPLETED');
  const localUri = params.localUri || downloadTask?.localUri;

  useEffect(() => {
    const loadVideoData = async () => {
      setLoading(true);
      try {
        const item = await apiService.getVideoById(params.id);
        if (item) {
          setVideo(item);
          // Load recommendations of same genre
          const recommendations = await apiService.getRecommendedVideos(item.genre);
          setRecommendations(recommendations.filter(r => r.id !== item.id));
        }

        // Load comments
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

  const handleDownload = () => {
    if (!video) return;
    if (user?.role === 'GUEST') {
      alert('Guest accounts cannot download. Please register to view offline.');
      return;
    }
    
    // Trigger download
    downloadManager.startDownload(
      video.id,
      video.videoUrl,
      video.title,
      video.thumbnailUrl,
      120 * 1024 * 1024 // Simulated 120MB file
    );
  };

  const handleCancelDownload = () => {
    if (!video) return;
    downloadManager.cancelDownload(video.id);
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !video) return;
    setSubmittingComment(true);
    try {
      const activeUser = user || {
        id: 'guest',
        displayName: 'Guest User',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
      };

      const newComment = await apiService.addComment(
        video.id,
        activeUser.id,
        activeUser.displayName,
        activeUser.avatarUrl,
        commentText
      );
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
          <ThemedText type="small" style={{ color: '#ffffff' }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Video Player Engine */}
      <VideoPlayer 
        video={video} 
        isOffline={isOffline} 
        offlineUri={localUri} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Detail Panel */}
        <View style={styles.detailCard}>
          <ThemedText type="title" style={styles.title}>
            {video.title}
          </ThemedText>

          <View style={styles.metaRow}>
            <ThemedText type="code" style={{ color: colors.textSecondary }}>
              {video.views.toLocaleString()} views • {new Date(video.uploadedAt).toLocaleDateString()}
            </ThemedText>
            <View style={styles.badge}>
              <ThemedText type="code" style={styles.badgeText}>{video.resolution}</ThemedText>
            </View>
          </View>

          {/* Action Row */}
          <View style={[styles.actionRow, { borderBottomColor: colors.backgroundElement, borderTopColor: colors.backgroundElement }]}>
            <Pressable style={styles.actionItem}>
              <Heart size={20} color={colors.text} />
              <ThemedText type="code" style={styles.actionText}>{video.likes.toLocaleString()}</ThemedText>
            </Pressable>

            {/* Offline download trigger */}
            {!downloadTask ? (
              <Pressable onPress={handleDownload} style={styles.actionItem}>
                <Download size={20} color={colors.text} />
                <ThemedText type="code" style={styles.actionText}>Download</ThemedText>
              </Pressable>
            ) : downloadTask.status === 'COMPLETED' ? (
              <Pressable onPress={handleCancelDownload} style={styles.actionItem}>
                <CheckCircle2 size={20} color="#4caf50" />
                <ThemedText type="code" style={{ color: '#4caf50', fontSize: 10 }}>Saved</ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={handleCancelDownload} style={styles.actionItem}>
                <ActivityIndicator size="small" color="#e50914" />
                <ThemedText type="code" style={{ color: '#e50914', fontSize: 10 }}>
                  {downloadTask.progress}%
                </ThemedText>
              </Pressable>
            )}

            <Pressable style={styles.actionItem}>
              <Share2 size={20} color={colors.text} />
              <ThemedText type="code" style={styles.actionText}>Share</ThemedText>
            </Pressable>

            <Pressable style={styles.actionItem}>
              <Plus size={20} color={colors.text} />
              <ThemedText type="code" style={styles.actionText}>Playlist</ThemedText>
            </Pressable>
          </View>

          {/* Creator Channel header */}
          <View style={styles.creatorChannel}>
            <Image source={{ uri: video.creatorAvatar }} style={styles.creatorAvatar} />
            <View style={styles.creatorMeta}>
              <ThemedText type="smallBold">{video.creatorName}</ThemedText>
              <ThemedText type="code" style={{ color: colors.textSecondary }}>124k subscribers</ThemedText>
            </View>
            <Pressable style={[styles.subBtn, { backgroundColor: colors.text }]}>
              <ThemedText type="code" style={{ color: colors.background, fontWeight: 'bold' }}>Subscribe</ThemedText>
            </Pressable>
          </View>

          {/* Video Description */}
          <View style={[styles.descBox, { backgroundColor: colors.backgroundElement }]}>
            <ThemedText type="small" style={{ color: colors.text }}>
              {video.description}
            </ThemedText>
          </View>
        </View>

        {/* AI Recommendations panel */}
        <View style={styles.recommendationSection}>
          <ThemedText type="smallBold" style={styles.sectionHeading}>More Like This</ThemedText>
          {recommendations.map((rec) => (
            <Pressable 
              key={rec.id} 
              onPress={() => router.push(`/watch/${rec.id}`)}
              style={styles.recRow}
            >
              <Image source={{ uri: rec.thumbnailUrl }} style={styles.recThumbnail} />
              <View style={styles.recDetails}>
                <ThemedText type="smallBold" numberOfLines={1}>{rec.title}</ThemedText>
                <ThemedText type="code" style={{ color: colors.textSecondary }}>
                  {rec.creatorName} • {rec.views.toLocaleString()} views
                </ThemedText>
                <ThemedText type="code" style={{ color: '#e50914' }}>{rec.tier}</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Comments ({comments.length})
          </ThemedText>
          
          {/* Comment inputs */}
          <View style={styles.commentInputRow}>
            <TextInput
              placeholder="Add a public comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              style={[styles.commentField, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
            />
            <Pressable 
              onPress={handlePostComment} 
              disabled={submittingComment || !commentText.trim()}
              style={[styles.commentPostBtn, { backgroundColor: '#e50914' }]}
            >
              <ThemedText type="code" style={{ color: '#ffffff' }}>Post</ThemedText>
            </Pressable>
          </View>

          {/* Comments list display */}
          <View style={styles.commentsList}>
            {comments.map((comm) => (
              <View key={comm.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Image source={{ uri: comm.avatarUrl }} style={styles.commentAvatar} />
                  <View style={styles.commentUserMeta}>
                    <ThemedText type="smallBold">{comm.username}</ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary }}>
                      {new Date(comm.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={styles.commentBody}>
                  {comm.content}
                </ThemedText>

                {/* Nested Replies */}
                {comm.replies && comm.replies.map((rep) => (
                  <View key={rep.id} style={[styles.replyCard, { backgroundColor: colors.backgroundElement }]}>
                    <View style={styles.commentHeader}>
                      <Image source={{ uri: rep.avatarUrl }} style={styles.commentAvatar} />
                      <View style={styles.commentUserMeta}>
                        <ThemedText type="smallBold">{rep.username}</ThemedText>
                        <ThemedText type="code" style={{ color: colors.textSecondary }}>
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={styles.commentBody}>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#e50914',
    borderRadius: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  detailCard: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: Spacing.one,
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 10,
  },
  creatorChannel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  creatorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#333',
  },
  creatorMeta: {
    flex: 1,
  },
  subBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
  },
  descBox: {
    padding: Spacing.three,
    borderRadius: 6,
    marginTop: Spacing.one,
  },
  recommendationSection: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  recThumbnail: {
    width: 120,
    aspectRatio: 16 / 9,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  recDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  commentsSection: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  commentField: {
    flex: 1,
    height: 40,
    borderBottomWidth: 1,
    fontSize: 13,
  },
  commentPostBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: 4,
  },
  commentsList: {
    gap: Spacing.three,
  },
  commentCard: {
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
  },
  commentUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentBody: {
    paddingLeft: 36,
  },
  replyCard: {
    marginLeft: 36,
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
});
