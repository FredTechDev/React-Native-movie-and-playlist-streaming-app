import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, UserRole, DeviceSession } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  mfaPending: boolean;
  biometricsSupported: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, otpCode?: string) => Promise<{ success: boolean; requiresMfa?: boolean }>;
  socialLogin: (provider: 'google' | 'apple' | 'facebook' | 'github') => Promise<boolean>;
  verifyMfa: (code: string) => Promise<boolean>;
  enableBiometrics: (enabled: boolean) => Promise<void>;
  logout: () => Promise<void>;
  terminateDeviceSession: (sessionId: string) => void;
  updateRole: (role: UserRole) => void;
}

const SECURE_TOKEN_KEY = 'user_access_token';

const MOCK_DEVICES: DeviceSession[] = [
  { id: 'dev-1', name: 'iPhone 15 Pro Max (Active)', lastActive: 'Just Now', current: true },
  { id: 'dev-2', name: 'Samsung QLED Smart TV 65"', lastActive: '2 hours ago', current: false },
  { id: 'dev-3', name: 'MacBook Pro 16" Safari', lastActive: '3 days ago', current: false }
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  mfaPending: false,
  biometricsSupported: true,
  loading: false,
  error: null,

  login: async (email, otpCode) => {
    set({ loading: true, error: null });
    try {
      // If MFA is not required/passed yet, simulate check
      if (email.includes('admin@netstream.com')) {
        if (!otpCode) {
          set({ mfaPending: true, loading: false });
          return { success: false, requiresMfa: true };
        }
      }

      // Simulate network request latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: 'user-01',
        email,
        username: email.split('@')[0],
        displayName: email.includes('admin') ? 'Global Administrator' : email.includes('creator') ? 'Nairobi Creator Studio' : 'Fred Musinde',
        avatarUrl: email.includes('admin') 
          ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' 
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        role: email.includes('admin') ? 'ADMIN' : email.includes('creator') ? 'CREATOR' : 'USER',
        mfaEnabled: email.includes('admin'),
        biometricsEnabled: false,
        accessToken: 'mock_jwt_access_token_xyz123',
        refreshToken: 'mock_jwt_refresh_token_abc789',
        devices: MOCK_DEVICES,
      };

      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, mockUser.accessToken);

      set({ user: mockUser, isAuthenticated: true, mfaPending: false, loading: false });
      return { success: true };
    } catch (err: any) {
      set({ error: err.message || 'Authentication failed', loading: false });
      return { success: false };
    }
  },

  socialLogin: async (provider) => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1200)); // OAuth delay
      const mockUser: User = {
        id: `oauth-${provider}`,
        email: `social.${provider}@netstream.com`,
        username: `social_${provider}`,
        displayName: `Social Streamer (${provider.toUpperCase()})`,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        role: 'USER',
        mfaEnabled: false,
        biometricsEnabled: false,
        accessToken: `oauth_token_${provider}_secret`,
        refreshToken: `oauth_refresh_${provider}_secret`,
        devices: [MOCK_DEVICES[0]],
      };

      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, mockUser.accessToken);
      set({ user: mockUser, isAuthenticated: true, loading: false });
      return true;
    } catch {
      set({ error: `Social Login via ${provider} failed`, loading: false });
      return false;
    }
  },

  verifyMfa: async (code) => {
    if (code === '123456') {
      const email = 'admin@netstream.com';
      await get().login(email, '123456');
      return true;
    }
    return false;
  },

  enableBiometrics: async (enabled) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, biometricsEnabled: enabled };
    set({ user: updatedUser });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    set({ user: null, isAuthenticated: false, mfaPending: false });
  },

  terminateDeviceSession: (sessionId) => {
    const { user } = get();
    if (!user) return;
    const updatedDevices = user.devices.filter(d => d.id !== sessionId);
    set({ user: { ...user, devices: updatedDevices } });
  },

  updateRole: (role) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, role } });
  }
}));
