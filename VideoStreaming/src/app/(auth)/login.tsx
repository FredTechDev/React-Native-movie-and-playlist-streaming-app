import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Chrome, Apple, Facebook, Github, Fingerprint, ShieldCheck } from 'lucide-react-native';
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
      router.replace('/(tabs)');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook' | 'github') => {
    const success = await socialLogin(provider);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleBiometricLogin = async () => {
    const creds = await secureStoreService.getBiometricCredentials();
    if (creds) {
      const authenticated = await secureStoreService.authenticateBiometrics();
      if (authenticated) {
        const response = await login(creds.email);
        if (response.success) {
          router.replace('/(tabs)');
        }
      }
    } else {
      // Simulate registering current device biometrics
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
      <View style={styles.content}>
        <View style={styles.header}>
          <ShieldCheck size={48} color="#e50914" />
          <ThemedText type="title" style={styles.title}>
            Sign In
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Access the ultimate video streaming platform
          </ThemedText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <ThemedText type="code" style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.form}>
          {/* Email field */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
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
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
                />
              )}
            />
          </View>
          {errors.email && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.email.message}
            </ThemedText>
          )}

          {/* Password field */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
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
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
                />
              )}
            />
          </View>
          {errors.password && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.password.message}
            </ThemedText>
          )}

          {/* Submit */}
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

        {/* Biometrics */}
        <Pressable onPress={handleBiometricLogin} style={styles.biometricsBtn}>
          <Fingerprint size={28} color="#e50914" />
          <ThemedText type="small" style={styles.biometricsText}>
            Sign In with Face ID / Fingerprint
          </ThemedText>
        </Pressable>

        {/* Social Authentication */}
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.backgroundElement }]} />
          <ThemedText type="code" style={styles.dividerText}>OR WATCH WITH</ThemedText>
          <View style={[styles.line, { backgroundColor: colors.backgroundElement }]} />
        </View>

        <View style={styles.socialGrid}>
          <Pressable onPress={() => handleSocialLogin('google')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Chrome size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('apple')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Apple size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('facebook')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Facebook size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => handleSocialLogin('github')} style={[styles.socialBtn, { backgroundColor: colors.backgroundElement }]}>
            <Github size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Register navigation link */}
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
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
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
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderBottomWidth: 1,
    paddingLeft: 36,
    fontSize: 15,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 9,
    marginTop: -Spacing.one,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    color: '#ffffff',
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
