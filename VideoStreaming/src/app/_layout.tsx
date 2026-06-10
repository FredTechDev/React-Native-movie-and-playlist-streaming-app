import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useAuthStore } from '@/store/useAuthStore';
import { secureStoreService } from '@/services/secureStore';

// Initialize React Query client for network caching and queries
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { login } = useAuthStore();

  useEffect(() => {
    // Attempt automatic biometric or session token restore on app launch
    const checkSession = async () => {
      const token = await secureStoreService.getAccessToken();
      if (token) {
        // Auto restore session for demo
        await login('fred@netstream.com');
      }
    };
    checkSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
