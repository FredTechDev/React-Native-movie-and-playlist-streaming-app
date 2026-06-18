import React, { useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { HardDrive, Trash2, Sliders, AlertCircle } from 'lucide-react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { useDownloadStore } from '../store/useDownloadStore';
import DownloadItem from '../components/DownloadItem';

export default function DownloadsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { 
    tasks, 
    totalDownloadedBytes, 
    availableStorageBytes,
    qualityPreference,
    setQualityPreference,
    refreshStorageStats,
    cancelDownload
  } = useDownloadStore();

  const taskList = Object.values(tasks);

  useEffect(() => {
    refreshStorageStats();
  }, [totalDownloadedBytes]);

  const handleClearAll = () => {
    if (taskList.length === 0) return;
    if (confirm('Are you sure you want to delete all offline videos?')) {
      taskList.forEach((t) => cancelDownload(t.videoId));
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  // Compute storage ratios
  const totalSimulatedDisk = 64 * 1024 * 1024 * 1024; // 64 GB
  const usedByAppPercentage = (totalDownloadedBytes / totalSimulatedDisk) * 100;
  const freeDiskPercentage = (availableStorageBytes / totalSimulatedDisk) * 100;
  const otherAppsPercentage = 100 - usedByAppPercentage - freeDiskPercentage;

  return (
    <ThemedView style={styles.container}>
      {/* Header Space */}
      <View style={styles.header}>
        <ThemedText type="title">Offline Downloads</ThemedText>
        <Pressable onPress={handleClearAll} style={styles.clearAllBtn}>
          <Trash2 size={16} color="#f44336" />
          <ThemedText type="code" style={{ color: '#f44336' }}>Delete All</ThemedText>
        </Pressable>
      </View>

      {/* Storage meter */}
      <ThemedView type="backgroundElement" style={styles.storageCard}>
        <View style={styles.storageHeading}>
          <HardDrive size={18} color={colors.textSecondary} />
          <ThemedText type="smallBold">Device Storage Capacity</ThemedText>
        </View>

        <View style={styles.gaugeContainer}>
          {/* App Used Bar */}
          <View style={[styles.gaugeSegment, { width: `${Math.max(1, usedByAppPercentage)}%`, backgroundColor: '#e50914' }]} />
          {/* Other Apps Used Bar */}
          <View style={[styles.gaugeSegment, { width: `${Math.max(1, otherAppsPercentage)}%`, backgroundColor: '#444448' }]} />
          {/* Free Space Bar */}
          <View style={[styles.gaugeSegment, { width: `${Math.max(1, freeDiskPercentage)}%`, backgroundColor: '#00c853' }]} />
        </View>

        <View style={styles.storageLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e50914' }]} />
            <ThemedText type="code" style={styles.legendText}>
              Netstream ({formatSize(totalDownloadedBytes)})
            </ThemedText>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#444448' }]} />
            <ThemedText type="code" style={styles.legendText}>
              Other Apps
            </ThemedText>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00c853' }]} />
            <ThemedText type="code" style={styles.legendText}>
              Free ({formatSize(availableStorageBytes)})
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Settings Options */}
      <ThemedView type="backgroundElement" style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <Sliders size={16} color={colors.textSecondary} />
          <ThemedText type="smallBold">Download Quality Target</ThemedText>
        </View>
        
        <View style={styles.qualitySelector}>
          {['360p', '720p', '1080p'].map((q) => (
            <Pressable
              key={q}
              onPress={() => setQualityPreference(q as any)}
              style={[
                styles.qualityBtn,
                qualityPreference === q && styles.activeQualityBtn,
                { backgroundColor: colors.backgroundSelected }
              ]}
            >
              <ThemedText 
                type="code" 
                style={{ color: qualityPreference === q ? '#ffffff' : colors.textSecondary }}
              >
                {q}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Downloads List */}
      <FlatList
        data={taskList}
        renderItem={({ item }) => <DownloadItem task={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={colors.backgroundSelected} />
            <ThemedText type="smallBold" style={{ color: colors.textSecondary }}>
              No offline downloads found
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Videos you download for offline viewing will appear here.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  storageCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  storageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gaugeContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#222',
  },
  gaugeSegment: {
    height: '100%',
  },
  storageLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: '#888888',
  },
  settingsCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  qualityBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeQualityBtn: {
    backgroundColor: '#e50914',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.two,
  },
});
