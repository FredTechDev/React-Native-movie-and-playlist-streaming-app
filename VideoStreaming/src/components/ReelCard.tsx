import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Image, Dimensions, useColorScheme, Modal, TextInput } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, Share2, Bookmark, Send, X } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { Video } from '../types';

interface ReelCardProps {
  video: Video;
  isActive: boolean; // Plays only when current slide is active
}

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
// Standard height excluding tabs bar roughly
const REEL_HEIGHT = WINDOW_HEIGHT - 80;

export default function ReelCard({ video, isActive }: ReelCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([
    { id: '1', user: 'johndoe', text: 'This Nairobi street food is delicious!' },
    { id: '2', user: 'creative_mind', text: 'Super clean editing here!' }
  ]);

  // Setup expo-video player
  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
    if (isActive) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player]);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
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

  return (
    <View style={styles.container}>
      {/* Video layer */}
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
      />

      {/* Touch overlay to pause/play */}
      <Pressable 
        onPress={() => {
          if (player.playing) {
            player.pause();
          } else {
            player.play();
          }
        }} 
        style={styles.videoOverlay} 
      />

      {/* Right-side action buttons */}
      <View style={styles.actionColumn}>
        {/* Creator profile */}
        <Image source={{ uri: video.creatorAvatar }} style={styles.avatarBorder} />

        {/* Like */}
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <Heart size={28} color={liked ? '#e50914' : '#ffffff'} fill={liked ? '#e50914' : 'transparent'} />
          <ThemedText type="code" style={styles.actionLabel}>
            {likeCount > 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
          </ThemedText>
        </Pressable>

        {/* Comment */}
        <Pressable onPress={() => setShowComments(true)} style={styles.actionButton}>
          <MessageCircle size={28} color="#ffffff" />
          <ThemedText type="code" style={styles.actionLabel}>
            {commentsList.length}
          </ThemedText>
        </Pressable>

        {/* Share */}
        <Pressable style={styles.actionButton}>
          <Share2 size={28} color="#ffffff" />
          <ThemedText type="code" style={styles.actionLabel}>Share</ThemedText>
        </Pressable>

        {/* Save/Bookmark */}
        <Pressable onPress={() => setSaved(!saved)} style={styles.actionButton}>
          <Bookmark size={28} color={saved ? '#e1ad01' : '#ffffff'} fill={saved ? '#e1ad01' : 'transparent'} />
          <ThemedText type="code" style={styles.actionLabel}>Save</ThemedText>
        </Pressable>
      </View>

      {/* Bottom details info card */}
      <View style={styles.detailsContainer}>
        <ThemedText type="smallBold" style={styles.creatorName}>
          @{video.creatorName}
        </ThemedText>
        <ThemedText type="small" style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </ThemedText>
        <ThemedText type="small" style={styles.videoDescription} numberOfLines={1}>
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
            {/* Header */}
            <View style={styles.drawerHeader}>
              <ThemedText type="smallBold">Comments ({commentsList.length})</ThemedText>
              <Pressable onPress={() => setShowComments(false)} style={styles.closeBtn}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* List */}
            <View style={styles.commentsList}>
              {commentsList.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <ThemedText type="smallBold" style={styles.commentUser}>
                    @{c.user}
                  </ThemedText>
                  <ThemedText type="small" style={styles.commentText}>
                    {c.text}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Input */}
            <View style={[styles.commentInputRow, { borderTopColor: colors.backgroundSelected }]}>
              <TextInput
                placeholder="Add comment..."
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
    height: REEL_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  actionColumn: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 120,
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ffffff',
    marginBottom: Spacing.one,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  detailsContainer: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    right: 80,
    zIndex: 10,
    gap: Spacing.one,
  },
  creatorName: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  videoTitle: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  videoDescription: {
    color: '#cccccc',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  drawerDismissZone: {
    flex: 1,
  },
  drawerContent: {
    height: WINDOW_HEIGHT * 0.5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.three,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  closeBtn: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
    gap: Spacing.two,
  },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  commentUser: {
    color: '#888888',
  },
  commentText: {
    color: '#ffffff',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: Spacing.three,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
