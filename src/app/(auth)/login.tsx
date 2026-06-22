import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, useColorScheme, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Globe, Apple, MessageCircle, Code2, Fingerprint, Play } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { secureStoreService } from '@/services/secureStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const CINEMATIC_BG = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80';

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { login, socialLogin, loading, error, enableBiometrics } = useAuthStore();
  const [mfaNeeded, setMfaNeeded] = useState(false);
  const [emailForMfa, setEmailForMfa] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    const response = await login(data.email);
    if (response.requiresMfa) {
      setMfaNeeded(true);
      setEmailForMfa(data.email);
      router.push({
        pathname: '/(auth)/verification',
        params: { email: data.email }
      });
    } else if (response.success) {
      router.replace('/');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook' | 'github') => {
    const success = await socialLogin(provider);
    if (success) {
      router.replace('/');
    }
  };

  const handleBiometricLogin = async () => {
    const creds = await secureStoreService.getBiometricCredentials();
    if (creds) {
      const authenticated = await secureStoreService.authenticateBiometrics();
      if (authenticated) {
        const response = await login(creds.email);
        if (response.success) {
          router.replace('/');
        }
      }
    } else {
      const authenticated = await secureStoreService.authenticateBiometrics();
      if (authenticated) {
        await secureStoreService.saveBiometricCredentials('fred@netstream.com', '123456');
        await enableBiometrics(true);
        alert('Biometrics registered for next login!');
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Cinematic Background */}
      <ImageBackground
        source={{ uri: CINEMATIC_BG }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Play size={20} color="#e50914" fill="#e50914" />
          </View>
          <ThemedText type="heroTitle" style={styles.title}>
            Sign In
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            Access the ultimate video streaming platform
          </ThemedText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <ThemedText type="code" style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
            <Mail size={16} color={colors.textSecondary} style={styles.inputIcon} />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: colors.text }]}
                />
              )}
            />
          </View>
          {errors.email && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.email.message}
            </ThemedText>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
            <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  style={[styles.input, { color: colors.text }]}
                />
              )}
            />
          </View>
          {errors.password && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.password.message}
            </ThemedText>
          )}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            style={[styles.submitButton, { backgroundColor: '#e50914' }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.submitText}>
                Continue
              </ThemedText>
            )}
          </Pressable>
        </View>

        <Pressable onPress={handleBiometricLogin} style={styles.biometricsBtn}>
          <Fingerprint size={22} color="#e50914" />
          <ThemedText type="small" style={styles.biometricsText}>
            Sign In with Face ID / Fingerprint
          </ThemedText>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <ThemedText type="code" style={styles.dividerText}>OR WATCH WITH</ThemedText>
          <View style={[styles.line, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        </View>

        <View style={styles.socialGrid}>
          <Pressable onPress={() => handleSocialLogin('google')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Globe size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('apple')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Apple size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('facebook')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <MessageCircle size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('github')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Code2 size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.footerLink}>
          <ThemedText type="small">New to Netstream?</ThemedText>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <ThemedText type="smallBold" style={{ color: '#e50914' }}>
              &nbsp;Sign Up now
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,9,20,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.25)',
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    fontSize: 11,
  },
  form: {
    gap: Spacing.three,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: Spacing.two,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 9,
    marginTop: -Spacing.one,
  },
  submitButton: {
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
  },
  biometricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  biometricsText: {
    fontSize: 13,
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 9,
    color: '#888888',
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
