import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { DownloadTask } from '../types';

const STORAGE_FILE_PATH = `${FileSystem.documentDirectory}downloads_store.json`;

// Custom Storage Engine using Expo File System for Native and localStorage for Web
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(name);
      } catch (e) {
        console.error('Failed to read from localStorage:', e);
        return null;
      }
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(STORAGE_FILE_PATH);
        const parsed = JSON.parse(content);
        return parsed[name] ? JSON.stringify(parsed[name]) : null;
      }
    } catch (e) {
      console.error('Error reading from file system storage:', e);
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(name, value);
      } catch (e) {
        console.error('Failed to write to localStorage:', e);
      }
      return;
    }
    try {
      let currentData: Record<string, any> = {};
      const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(STORAGE_FILE_PATH);
        currentData = JSON.parse(content);
      }
      currentData[name] = JSON.parse(value);
      await FileSystem.writeAsStringAsync(STORAGE_FILE_PATH, JSON.stringify(currentData));
    } catch (e) {
      console.error('Error writing to file system storage:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(name);
      } catch (e) {
        console.error('Failed to remove from localStorage:', e);
      }
      return;
    }
    try {
      let currentData: Record<string, any> = {};
      const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(STORAGE_FILE_PATH);
        currentData = JSON.parse(content);
      }
      delete currentData[name];
      await FileSystem.writeAsStringAsync(STORAGE_FILE_PATH, JSON.stringify(currentData));
    } catch (e) {
      console.error('Error removing from file system storage:', e);
    }
  },
};

interface DownloadState {
  tasks: Record<string, DownloadTask>;
  totalDownloadedBytes: number;
  availableStorageBytes: number;
  qualityPreference: '360p' | '720p' | '1080p';
  
  addToQueue: (videoId: string, title: string, thumbnailUrl: string, sizeBytes: number) => void;
  pauseDownload: (taskId: string) => void;
  resumeDownload: (taskId: string) => void;
  cancelDownload: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number, localUri?: string) => void;
  updateTaskStatus: (taskId: string, status: DownloadTask['status'], error?: string) => void;
  setQualityPreference: (quality: '360p' | '720p' | '1080p') => void;
  refreshStorageStats: () => void;
  verifyOfflineFiles: () => Promise<void>;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      tasks: {},
      totalDownloadedBytes: 0,
      availableStorageBytes: 64 * 1024 * 1024 * 1024, // 64 GB simulated
      qualityPreference: '720p',

      addToQueue: (videoId, title, thumbnailUrl, sizeBytes) => {
        set((state) => {
          const taskId = `dl-${videoId}`;
          if (state.tasks[taskId]) return state; // Already exists

          const newTask: DownloadTask = {
            id: taskId,
            videoId,
            title,
            thumbnailUrl,
            progress: 0,
            status: 'ENQUEUED',
            sizeBytes,
            quality: state.qualityPreference
          };

          return {
            tasks: { ...state.tasks, [taskId]: newTask }
          };
        });
      },

      pauseDownload: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task || task.status !== 'DOWNLOADING') return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: { ...task, status: 'PAUSED' }
            }
          };
        });
      },

      resumeDownload: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task || task.status !== 'PAUSED') return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: { ...task, status: 'DOWNLOADING' }
            }
          };
        });
      },

      cancelDownload: (taskId) => {
        set((state) => {
          const updatedTasks = { ...state.tasks };
          const task = updatedTasks[taskId];
          
          let byteReduction = 0;
          if (task && task.status === 'COMPLETED') {
            byteReduction = task.sizeBytes;
          }
          
          delete updatedTasks[taskId];
          return {
            tasks: updatedTasks,
            totalDownloadedBytes: Math.max(0, state.totalDownloadedBytes - byteReduction)
          };
        });
      },

      updateTaskProgress: (taskId, progress, localUri) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          const updatedTask = { ...task, progress };
          if (localUri) {
            updatedTask.localUri = localUri;
          }

          return {
            tasks: { ...state.tasks, [taskId]: updatedTask }
          };
        });
      },

      updateTaskStatus: (taskId, status, error) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          const updatedTask = { ...task, status };
          let byteIncrement = 0;

          if (status === 'COMPLETED') {
            byteIncrement = task.sizeBytes;
          }

          return {
            tasks: { ...state.tasks, [taskId]: updatedTask },
            totalDownloadedBytes: state.totalDownloadedBytes + byteIncrement
          };
        });
      },

      setQualityPreference: (quality) => {
        set({ qualityPreference: quality });
      },

      refreshStorageStats: () => {
        set((state) => ({
          availableStorageBytes: 64 * 1024 * 1024 * 1024 - state.totalDownloadedBytes
        }));
      },

      verifyOfflineFiles: async () => {
        if (Platform.OS === 'web') return;
        const { tasks } = get();
        let changed = false;
        const updatedTasks = { ...tasks };

        for (const taskId in updatedTasks) {
          const task = updatedTasks[taskId];
          if (task.status === 'COMPLETED' && task.localUri) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(task.localUri);
              if (!fileInfo.exists) {
                updatedTasks[taskId] = { 
                  ...task, 
                  status: 'FAILED', 
                  progress: 0, 
                  localUri: undefined 
                };
                changed = true;
              }
            } catch (err) {
              console.error(`Error verifying file for task ${taskId}:`, err);
              updatedTasks[taskId] = { 
                ...task, 
                status: 'FAILED', 
                progress: 0, 
                localUri: undefined 
              };
              changed = true;
            }
          }
        }

        if (changed) {
          let totalDownloaded = 0;
          Object.values(updatedTasks).forEach((t) => {
            if (t.status === 'COMPLETED') {
              totalDownloaded += t.sizeBytes;
            }
          });
          set({ tasks: updatedTasks, totalDownloadedBytes: totalDownloaded });
          get().refreshStorageStats();
        }
      }
    }),
    {
      name: 'netstream-download-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
