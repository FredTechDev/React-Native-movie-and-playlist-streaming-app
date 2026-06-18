import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useDownloadStore } from '../store/useDownloadStore';

// Keeps track of active download resumable objects
const activeDownloads: Record<string, any> = {};

export const downloadManager = {
  /**
   * Enqueues and triggers a background video download
   */
  startDownload: async (videoId: string, videoUrl: string, title: string, thumbnailUrl: string, sizeBytes: number) => {
    const store = useDownloadStore.getState();
    const taskId = `dl-${videoId}`;

    // Add to Zustand queue
    store.addToQueue(videoId, title, thumbnailUrl, sizeBytes);
    store.updateTaskStatus(taskId, 'DOWNLOADING');

    if (Platform.OS === 'web') {
      // Simulate download progress on web
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        store.updateTaskProgress(taskId, progress);

        if (progress >= 100) {
          clearInterval(interval);
          store.updateTaskStatus(taskId, 'COMPLETED');
          store.updateTaskProgress(taskId, 100, `local://offline_${videoId}.mp4`);
          store.refreshStorageStats();
        }
      }, 500);
      return;
    }

    try {
      const fs = FileSystem as any;
      const filename = `${videoId}.mp4`;
      const fileUri = `${fs.documentDirectory}${filename}`;

      // Create download resumable object
      const callback = (downloadProgress: any) => {
        const percentage = Math.round(
          (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
        );
        store.updateTaskProgress(taskId, percentage);
      };

      const downloadResumable = fs.createDownloadResumable(
        videoUrl,
        fileUri,
        {},
        callback
      );

      activeDownloads[taskId] = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        store.updateTaskStatus(taskId, 'COMPLETED');
        store.updateTaskProgress(taskId, 100, result.uri);
        delete activeDownloads[taskId];
      } else {
        store.updateTaskStatus(taskId, 'FAILED');
      }
      store.refreshStorageStats();
    } catch (error) {
      console.error('Download error:', error);
      store.updateTaskStatus(taskId, 'FAILED');
    }
  },

  /**
   * Pauses an active download
   */
  pauseDownload: async (videoId: string) => {
    const taskId = `dl-${videoId}`;
    const store = useDownloadStore.getState();
    
    if (Platform.OS === 'web') {
      store.pauseDownload(taskId);
      return;
    }

    const downloadResumable = activeDownloads[taskId];
    if (downloadResumable) {
      try {
        await downloadResumable.pauseAsync();
        store.pauseDownload(taskId);
      } catch (err) {
        console.error('Failed to pause download:', err);
      }
    }
  },

  /**
   * Resumes a paused download
   */
  resumeDownload: async (videoId: string) => {
    const taskId = `dl-${videoId}`;
    const store = useDownloadStore.getState();

    if (Platform.OS === 'web') {
      store.resumeDownload(taskId);
      // Simulate download progress resumed
      const currentTask = store.tasks[taskId];
      let progress = currentTask ? currentTask.progress : 0;
      const interval = setInterval(() => {
        const task = useDownloadStore.getState().tasks[taskId];
        if (!task || task.status !== 'DOWNLOADING') {
          clearInterval(interval);
          return;
        }

        progress += 10;
        store.updateTaskProgress(taskId, Math.min(progress, 100));

        if (progress >= 100) {
          clearInterval(interval);
          store.updateTaskStatus(taskId, 'COMPLETED');
          store.updateTaskProgress(taskId, 100, `local://offline_${videoId}.mp4`);
          store.refreshStorageStats();
        }
      }, 500);
      return;
    }

    const downloadResumable = activeDownloads[taskId];
    if (downloadResumable) {
      try {
        store.resumeDownload(taskId);
        const result = await downloadResumable.resumeAsync();
        if (result && result.uri) {
          store.updateTaskStatus(taskId, 'COMPLETED');
          store.updateTaskProgress(taskId, 100, result.uri);
          delete activeDownloads[taskId];
        } else {
          store.updateTaskStatus(taskId, 'FAILED');
        }
        store.refreshStorageStats();
      } catch (err) {
        console.error('Failed to resume download:', err);
        store.updateTaskStatus(taskId, 'FAILED');
      }
    }
  },

  /**
   * Cancels and deletes download
   */
  cancelDownload: async (videoId: string) => {
    const taskId = `dl-${videoId}`;
    const store = useDownloadStore.getState();
    const task = store.tasks[taskId];

    if (Platform.OS === 'web') {
      store.cancelDownload(taskId);
      return;
    }

    // Cancel active task if running
    const downloadResumable = activeDownloads[taskId];
    if (downloadResumable) {
      try {
        await downloadResumable.cancelAsync();
      } catch (e) {
        // ignore cancellation failure
      }
      delete activeDownloads[taskId];
    }

    // Delete local file if it exists
    if (task && task.localUri) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(task.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(task.localUri);
        }
      } catch (err) {
        console.error('Failed to delete offline file:', err);
      }
    }

    store.cancelDownload(taskId);
    store.refreshStorageStats();
  },

  /**
   * Monitor free space on device
   */
  getFreeDiskSpace: async (): Promise<number> => {
    if (Platform.OS === 'web') {
      return 60 * 1024 * 1024 * 1024; // 60 GB simulated free
    }
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      return freeSpace;
    } catch {
      return 0;
    }
  }
};
