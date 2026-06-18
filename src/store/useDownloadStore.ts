import { create } from 'zustand';
import { DownloadTask } from '../types';

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
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
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
    // Simulate updating storage numbers
    set((state) => ({
      availableStorageBytes: 64 * 1024 * 1024 * 1024 - state.totalDownloadedBytes
    }));
  }
}));
