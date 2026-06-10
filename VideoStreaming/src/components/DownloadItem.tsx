import React from 'react';
import { StyleSheet, View, Image, Pressable, useColorScheme } from 'react-native';
import { Play, Pause, Trash2, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { downloadManager } from '../services/downloadManager';
import { DownloadTask } from '../types';
import { useRouter } from 'expo-router';

interface DownloadItemProps {
  task: DownloadTask;
}

export default function DownloadItem({ task }: DownloadItemProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const handlePauseResume = () => {
    const videoId = task.videoId;
    if (task.status === 'DOWNLOADING') {
      downloadManager.pauseDownload(videoId);
    } else if (task.status === 'PAUSED') {
      downloadManager.resumeDownload(videoId);
    }
  };

  const handleDelete = () => {
    downloadManager.cancelDownload(task.videoId);
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleWatchOffline = () => {
    if (task.status === 'COMPLETED') {
      router.push({
        pathname: `/watch/${task.videoId}`,
        params: { isOffline: 'true', localUri: task.localUri }
      });
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <Pressable onPress={handleWatchOffline} style={styles.thumbnailPressable}>
        <Image source={{ uri: task.thumbnailUrl }} style={styles.thumbnail} />
        {task.status === 'COMPLETED' && (
          <View style={styles.playOverlay}>
            <Play size={20} color="#ffffff" fill="#ffffff" />
          </View>
        )}
      </Pressable>

      <View style={styles.details}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
          {task.title}
        </ThemedText>

        <View style={styles.metadata}>
          <ThemedText type="code" style={styles.metaText}>
            {task.quality}
          </ThemedText>
          <ThemedText type="code" style={styles.metaText}>
            •
          </ThemedText>
          <ThemedText type="code" style={styles.metaText}>
            {formatSize(task.sizeBytes)}
          </ThemedText>
        </View>

        {/* Progress Display */}
        {task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${task.progress}%` }]} />
            </View>
            <ThemedText type="code" style={styles.progressText}>
              {task.progress}%
            </ThemedText>
          </View>
        )}

        {/* Status Text Indicator */}
        <View style={styles.statusRow}>
          {task.status === 'COMPLETED' && (
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#4caf50" />
              <ThemedText type="code" style={{ color: '#4caf50' }}>Offline Ready</ThemedText>
            </View>
          )}
          {task.status === 'FAILED' && (
            <View style={styles.statusBadge}>
              <AlertCircle size={12} color="#f44336" />
              <ThemedText type="code" style={{ color: '#f44336' }}>Failed</ThemedText>
            </View>
          )}
          {task.status === 'PAUSED' && (
            <ThemedText type="code" style={styles.statusText}>Paused</ThemedText>
          )}
          {task.status === 'ENQUEUED' && (
            <ThemedText type="code" style={styles.statusText}>Waiting in queue...</ThemedText>
          )}
          {task.status === 'DOWNLOADING' && (
            <ThemedText type="code" style={styles.statusText}>Downloading...</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {(task.status === 'DOWNLOADING' || task.status === 'PAUSED') && (
          <Pressable onPress={handlePauseResume} style={styles.actionBtn}>
            {task.status === 'DOWNLOADING' ? (
              <Pause size={18} color={colors.text} />
            ) : (
              <Play size={18} color={colors.text} fill={colors.text} />
            )}
          </Pressable>
        )}

        <Pressable onPress={handleDelete} style={styles.actionBtn}>
          <Trash2 size={18} color="#f44336" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
  },
  thumbnailPressable: {
    position: 'relative',
    width: 100,
    aspectRatio: 16 / 9,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
  },
  metadata: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: '#888888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  progressText: {
    fontSize: 9,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    color: '#888888',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionBtn: {
    padding: 8,
  },
});
