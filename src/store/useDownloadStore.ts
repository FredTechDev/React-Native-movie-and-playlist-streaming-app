import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadTask } from '../types';

const storage = Platform.OS === 'web'
  ? createJSONStorage(() => ({
      getItem: async (name: string) => {
        try {
          return localStorage.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: async (name: string, value: string) => {
        try {
          localStorage.setItem(name, value);
        } catch (e) {
          console.error('Failed to write to localStorage:', e);
        }
      },
      removeItem: async (name: string) => {
        try {
          localStorage.removeItem(name);
        } catch (e) {
          console.error('Failed to remove from localStorage:', e);
        }
      },
    }))
  : createJSONStorage(() => AsyncStorage);

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
              const response = await fetch(task.localUri, { method: 'HEAD' });
              if (!response.ok) {
                updatedTasks[taskId] = { 
                  ...task, 
                  status: 'FAILED', 
                  progress: 0, 
                  localUri: undefined 
                };
                changed = true;
              }
            } catch {
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
      storage,
    }
  )
);
