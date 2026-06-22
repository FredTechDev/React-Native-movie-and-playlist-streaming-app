import React from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Phone, ArrowLeft } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().min(9, 'Please enter a valid phone number')
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { login, loading, error } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', phoneNumber: '' }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // In standard NestJS backend implementation, we hit: POST /api/auth/register
    // Here we simulate successful registration and auto login
    const response = await login(data.email);
    if (response.success) {
      router.replace('/');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back to login */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={20} color={colors.text} />
        <ThemedText type="small">Back to Login</ThemedText>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Sign up to stream movies and create playlists
          </ThemedText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <ThemedText type="code" style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.form}>
          {/* Display Name */}
          <View style={styles.inputContainer}>
            <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
                />
              )}
            />
          </View>
          {errors.displayName && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.displayName.message}
            </ThemedText>
          )}

          {/* Email */}
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

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Phone Number (e.g. +254...)"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.backgroundElement }]}
                />
              )}
            />
          </View>
          {errors.phoneNumber && (
            <ThemedText type="code" style={styles.fieldError}>
              {errors.phoneNumber.message}
            </ThemedText>
          )}

          {/* Password */}
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
                Create Account
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Login navigation link */}
        <View style={styles.footerLink}>
          <ThemedText type="small">Already have an account?</ThemedText>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <ThemedText type="smallBold" style={{ color: '#e50914' }}>
              &nbsp;Sign In
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
    padding: Spacing.four,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    position: 'absolute',
    top: Spacing.five,
    left: Spacing.four,
    zIndex: 10,
  },
  content: {
    gap: Spacing.four,
    marginTop: Spacing.four,
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
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
