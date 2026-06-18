import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const JWT_KEY = 'netstream_access_token';
const REF_KEY = 'netstream_refresh_token';
const CREDENTIALS_KEY = 'netstream_biometric_credentials';

export const secureStoreService = {
  saveTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(JWT_KEY, accessToken);
      await SecureStore.setItemAsync(REF_KEY, refreshToken);
      return true;
    } catch (error) {
      console.error('SecureStore Error saving tokens:', error);
      return false;
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(JWT_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(REF_KEY);
    } catch {
      return null;
    }
  },

  clearTokens: async () => {
    try {
      await SecureStore.deleteItemAsync(JWT_KEY);
      await SecureStore.deleteItemAsync(REF_KEY);
      return true;
    } catch {
      return false;
    }
  },

  // Biometric details storage
  saveBiometricCredentials: async (email: string, pin: string) => {
    try {
      const payload = JSON.stringify({ email, pin });
      await SecureStore.setItemAsync(CREDENTIALS_KEY, payload);
      return true;
    } catch {
      return false;
    }
  },

  getBiometricCredentials: async (): Promise<{ email: string; pin: string } | null> => {
    try {
      const payload = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      return payload ? JSON.parse(payload) : null;
    } catch {
      return null;
    }
  },

  clearBiometricCredentials: async () => {
    try {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      return true;
    } catch {
      return false;
    }
  },

  // Native biometrics support simulation
  authenticateBiometrics: async (): Promise<boolean> => {
    // Simulate biometric confirmation modal lag
    await new Promise((resolve) => setTimeout(resolve, 800));
    // True triggers authenticated session
    return true;
  }
};
