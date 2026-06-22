import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Image, Dimensions, useColorScheme, Modal, TextInput, Animated, Share, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, Share2, Bookmark, Send, X, Download, Check, Play, Pause, AlertCircle, Plus } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { Video } from '../types';
import { useDownloadStore } from '../store/useDownloadStore';
import { downloadManager } from '../services/downloadManager';

interface ReelCardProps {
  video: Video;
  isActive: boolean; // Plays only when current slide is active
  height: number;    // Measured screen container height
}

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Separate, lightweight active player component
// This guarantees that we instantiate useVideoPlayer ONLY when the card is active,
// avoiding device video decoder exhaustion and maximizing performance.
interface ActiveVideoPlayerProps {
  videoUrl: string;
  isPaused: boolean;
}

function ActiveVideoPlayer({ videoUrl, isPaused }: ActiveVideoPlayerProps) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

export default function ReelCard({ video, isActive, height }: ReelCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([
    { id: '1', user: 'johndoe', text: 'This reel is absolutely spectacular!' },
    { id: '2', user: 'creative_mind', text: 'Stunning cinematography right here!' },
    { id: '3', user: 'movielover', text: 'Wow, this looks like a cinematic film.' }
  ]);

  // Play/Pause State
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayStateOverlay, setShowPlayStateOverlay] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Double Tap & Floating Heart Animation States
  const [lastTap, setLastTap] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Offline Download integration
  const { tasks, addToQueue, updateTaskProgress, updateTaskStatus } = useDownloadStore();
  const taskId = `dl-${video.id}`;
  const downloadTask = tasks[taskId];

  // Auto-resume play state on active transition
  useEffect(() => {
    if (isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  const handleSingleOrDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap -> trigger like + spring heart animation
      if (!liked) {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
      triggerHeartAnimation();
    } else {
      // Single tap -> toggle Play/Pause
      setIsPaused((prev) => {
        const next = !prev;
        triggerPlayStateOverlay();
        return next;
      });
    }
    setLastTap(now);
  };

  const triggerHeartAnimation = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.6,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  const triggerPlayStateOverlay = () => {
    setShowPlayStateOverlay(true);
    overlayOpacity.setValue(1);
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowPlayStateOverlay(false);
    });
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      triggerHeartAnimation();
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    setCommentsList((prev) => [
      ...prev,
      { id: Date.now().toString(), user: 'fred_m', text: commentText }
    ]);
    setCommentText('');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this cool reel on Netstream: "${video.title}"!\nURL: ${video.videoUrl}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDownload = async () => {
    if (downloadTask) {
      if (downloadTask.status === 'COMPLETED') {
        alert('This video is already downloaded to your local Movie Box library!');
        return;
      }
      alert('Download is currently in progress...');
      return;
    }

    // Call standard background downloader
    downloadManager.startDownload(
      video.id,
      video.videoUrl,
      video.title,
      video.thumbnailUrl,
      8 * 1024 * 1024 // 8 MB
    );
  };

  // Determine the URL to play: use downloaded local file if completed, otherwise stream from internet
  const playUrl = downloadTask?.status === 'COMPLETED' && downloadTask.localUri
    ? downloadTask.localUri
    : video.videoUrl;

  return (
    <View style={[styles.container, { height }]}>
      {/* Video / Thumbnail Layer */}
      {isActive ? (
        <ActiveVideoPlayer videoUrl={playUrl} isPaused={isPaused} />
      ) : (
        <Image source={{ uri: video.thumbnailUrl }} style={styles.videoPlaceholder} resizeMode="cover" />
      )}

      {/* Touch overlay to register play/pause & double tap like */}
      <Pressable onPress={handleSingleOrDoubleTap} style={styles.videoOverlay} />

      {/* Flying Heart Animation Overlay */}
      <Animated.View
        style={[
          styles.animatedHeartContainer,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
      >
        <Heart size={80} color="#e50914" fill="#e50914" />
      </Animated.View>

      {/* Play/Pause state Overlay Indicator */}
      {showPlayStateOverlay && (
        <Animated.View style={[styles.playStateOverlay, { opacity: overlayOpacity }]}>
          {isPaused ? (
            <Pause size={50} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={50} color="#ffffff" fill="#ffffff" />
          )}
        </Animated.View>
      )}

      {/* Right-side Action Column */}
      <View style={styles.actionColumn}>
        {/* Creator profile picture & Follow button */}
        <View style={styles.avatarContainer}>
          <Image source={{ uri: video.creatorAvatar }} style={styles.avatar} />
          {!subscribed && (
            <Pressable onPress={() => setSubscribed(true)} style={styles.followBadge}>
              <Plus size={12} color="#ffffff" strokeWidth={3} />
            </Pressable>
          )}
        </View>

        {/* Like Button */}
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <View style={styles.iconCircle}>
            <Heart size={24} color={liked ? '#e50914' : '#ffffff'} fill={liked ? '#e50914' : 'transparent'} />
          </View>
          <ThemedText type="code" style={styles.actionLabel}>
            {likeCount > 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
          </ThemedText>
        </Pressable>

        {/* Comment Button */}
        <Pressable onPress={() => setShowComments(true)} style={styles.actionButton}>
          <View style={styles.iconCircle}>
            <MessageCircle size={24} color="#ffffff" />
          </View>
          <ThemedText type="code" style={styles.actionLabel}>
            {commentsList.length}
          </ThemedText>
        </Pressable>

        {/* Download Button (Offline Storage) */}
        <Pressable onPress={handleDownload} style={styles.actionButton}>
          <View style={styles.iconCircle}>
            {downloadTask?.status === 'COMPLETED' ? (
              <Check size={24} color="#4caf50" strokeWidth={2.5} />
            ) : downloadTask?.status === 'DOWNLOADING' ? (
              <ActivityIndicator size="small" color="#e50914" />
            ) : downloadTask?.status === 'FAILED' ? (
              <AlertCircle size={24} color="#f44336" />
            ) : (
              <Download size={24} color="#ffffff" />
            )}
          </View>
          <ThemedText type="code" style={styles.actionLabel}>
            {downloadTask?.status === 'DOWNLOADING' ? `${downloadTask.progress}%` : downloadTask?.status === 'COMPLETED' ? 'Saved' : 'Save'}
          </ThemedText>
        </Pressable>

        {/* Share Button */}
        <Pressable onPress={handleShare} style={styles.actionButton}>
          <View style={styles.iconCircle}>
            <Share2 size={24} color="#ffffff" />
          </View>
          <ThemedText type="code" style={styles.actionLabel}>Share</ThemedText>
        </Pressable>

        {/* Save/Bookmark Button */}
        <Pressable onPress={() => setSaved(!saved)} style={styles.actionButton}>
          <View style={styles.iconCircle}>
            <Bookmark size={24} color={saved ? '#e1ad01' : '#ffffff'} fill={saved ? '#e1ad01' : 'transparent'} />
          </View>
          <ThemedText type="code" style={styles.actionLabel}>{saved ? 'Saved' : 'Keep'}</ThemedText>
        </Pressable>
      </View>

      {/* Bottom Details Info overlay */}
      <View style={styles.detailsContainer}>
        <View style={styles.creatorRow}>
          <ThemedText type="smallBold" style={styles.creatorName}>
            @{video.creatorName}
          </ThemedText>
          {subscribed && (
            <View style={styles.followingBadge}>
              <ThemedText type="code" style={styles.followingText}>FOLLOWING</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="smallBold" style={styles.videoTitle} numberOfLines={1}>
          {video.title}
        </ThemedText>
        <ThemedText type="small" style={styles.videoDescription} numberOfLines={2}>
          {video.description}
        </ThemedText>
      </View>

      {/* Comments Drawer Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerDismissZone} onPress={() => setShowComments(false)} />
          <ThemedView type="backgroundElement" style={styles.drawerContent}>
            {/* Header drag bar */}
            <View style={styles.dragIndicator} />
            <View style={styles.drawerHeader}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>Comments ({commentsList.length})</ThemedText>
              <Pressable onPress={() => setShowComments(false)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* List */}
            <View style={styles.commentsList}>
              {commentsList.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <Image
                    source={{ uri: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80` }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentTextContainer}>
                    <ThemedText type="smallBold" style={[styles.commentUser, { color: colors.text }]}>
                      @{c.user}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.commentText, { color: colors.text }]}>
                      {c.text}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {/* Input */}
            <View style={[styles.commentInputRow, { borderTopColor: colors.backgroundSelected }]}>
              <TextInput
                placeholder="Add to the conversation..."
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                style={[styles.commentInput, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
              />
              <Pressable onPress={handleSendComment} style={styles.commentSendBtn}>
                <Send size={16} color="#ffffff" />
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  animatedHeartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    zIndex: 99,
  },
  playStateOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -35,
    marginTop: -35,
    zIndex: 98,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
  actionColumn: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 90,
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#333',
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#e50914',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 10.5,
    marginTop: 4,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailsContainer: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.four,
    right: 80,
    zIndex: 10,
    gap: Spacing.one,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  creatorName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followingText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoDescription: {
    color: '#dddddd',
    fontSize: 11,
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  drawerDismissZone: {
    flex: 1,
  },
  drawerContent: {
    height: WINDOW_HEIGHT * 0.55,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.three,
    backgroundColor: '#161719',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  closeBtn: {
    padding: 6,
  },
  commentsList: {
    flex: 1,
    gap: Spacing.three,
  },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  commentTextContainer: {
    flex: 1,
    gap: 1,
  },
  commentUser: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  commentInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: Spacing.four,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
