import { create } from 'zustand';
import { Video } from '../types';

interface PlaybackProgress {
  videoId: string;
  position: number; // in seconds
  duration: number;
  updatedAt: string;
}

interface PlayerState {
  currentVideo: Video | null;
  playbackProgress: Record<string, PlaybackProgress>;
  isPipActive: boolean;
  isCasting: boolean;
  castDeviceName: string | null;
  playbackSpeed: number;
  subtitlesEnabled: boolean;
  selectedLanguage: string;
  
  startPlaying: (video: Video) => void;
  stopPlaying: () => void;
  updateProgress: (videoId: string, position: number, duration: number) => void;
  setPipActive: (active: boolean) => void;
  setCastDevice: (deviceName: string | null) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleSubtitles: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentVideo: null,
  playbackProgress: {},
  isPipActive: false,
  isCasting: false,
  castDeviceName: null,
  playbackSpeed: 1.0,
  subtitlesEnabled: false,
  selectedLanguage: 'en',

  startPlaying: (video) => {
    set({ currentVideo: video, isPipActive: false });
  },

  stopPlaying: () => {
    set({ currentVideo: null });
  },

  updateProgress: (videoId, position, duration) => {
    set((state) => {
      const existing = state.playbackProgress[videoId];
      if (existing && Math.abs(existing.position - position) < 1) {
        return {};
      }
      const updatedProgress = { ...state.playbackProgress };
      if (position / duration >= 0.95) {
        delete updatedProgress[videoId];
      } else {
        updatedProgress[videoId] = {
          videoId,
          position,
          duration,
          updatedAt: new Date().toISOString()
        };
      }
      return { playbackProgress: updatedProgress };
    });
  },

  setPipActive: (active) => {
    set({ isPipActive: active });
  },

  setCastDevice: (deviceName) => {
    set({ 
      isCasting: deviceName !== null, 
      castDeviceName: deviceName 
    });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  toggleSubtitles: (enabled) => {
    set({ subtitlesEnabled: enabled });
  },

  setLanguage: (lang) => {
    set({ selectedLanguage: lang });
  }
}));
