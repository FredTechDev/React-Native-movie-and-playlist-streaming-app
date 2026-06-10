import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Image, ActivityIndicator, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, ShieldAlert, Award } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { apiService } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import LiveChat from '@/components/LiveChat';
import { Video } from '@/types';

export default function LiveStreamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [viewersCount, setViewersCount] = useState(1240);

  useEffect(() => {
    const loadStream = async () => {
      setLoading(true);
      try {
        const item = await apiService.getVideoById(params.id || 'l1');
        if (item) {
          setVideo(item);
          setViewersCount(item.liveViewerCount || 2340);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [params.id]);

  // Simulate viewer fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setViewersCount((prev) => prev + Math.floor(Math.random() * 20 - 10));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
        <ThemedText type="smallBold">Live stream not found</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="small" style={{ color: '#ffffff' }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Live Video Player Stream */}
      <VideoPlayer video={video} />

      {/* Stream Info Bar */}
      <View style={[styles.infoBar, { borderBottomColor: colors.backgroundElement }]}>
        <View style={styles.badgeRow}>
          <View style={styles.liveBadge}>
            <ThemedText type="code" style={styles.liveText}>LIVE</ThemedText>
          </View>
          <View style={[styles.viewersBadge, { backgroundColor: colors.backgroundElement }]}>
            <Users size={12} color={colors.textSecondary} />
            <ThemedText type="code" style={{ color: colors.textSecondary }}>
              {viewersCount.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
          {video.title}
        </ThemedText>

        <View style={styles.creatorRow}>
          <Image source={{ uri: video.creatorAvatar }} style={styles.creatorAvatar} />
          <View style={styles.creatorMeta}>
            <ThemedText type="smallBold">{video.creatorName}</ThemedText>
            <ThemedText type="code" style={{ color: colors.textSecondary }}>Host</ThemedText>
          </View>
        </View>
      </View>

      {/* Live Chat component */}
      <View style={styles.chatWrapper}>
        <LiveChat videoId={video.id} />
      </View>
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
  infoBar: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  liveBadge: {
    backgroundColor: '#e50914',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  title: {
    fontSize: 15,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 4,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  creatorMeta: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
  },
});
