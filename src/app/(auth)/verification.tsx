import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function VerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { verifyMfa, loading } = useAuthStore();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code');
      return;
    }

    setErrorMsg(null);
    const success = await verifyMfa(code);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setErrorMsg('Invalid verification code. Try "123456" for demo admin login.');
    }
  };

  const handleResend = () => {
    setResendTimer(60);
    setErrorMsg(null);
    alert(`Verification OTP resent to ${params.email || 'your device'}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={20} color={colors.text} />
        <ThemedText type="small">Back</ThemedText>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <KeyRound size={48} color="#e50914" />
          <ThemedText type="title" style={styles.title}>
            Enter OTP Code
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: colors.textSecondary }]}>
            A 6-digit verification code was sent to your email{' '}
            <ThemedText type="smallBold">{params.email || 'registered address'}</ThemedText>
          </ThemedText>
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <ThemedText type="code" style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        <View style={styles.otpSection}>
          <TextInput
            placeholder="000000"
            placeholderTextColor={colors.backgroundSelected}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, ''));
              setErrorMsg(null);
            }}
            style={[
              styles.codeInputField, 
              { 
                color: colors.text, 
                backgroundColor: colors.backgroundElement,
                borderColor: code.length === 6 ? '#e50914' : 'transparent'
              }
            ]}
          />

          <Pressable 
            onPress={handleVerify} 
            style={[styles.verifyBtn, { backgroundColor: '#e50914' }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.verifyBtnText}>
                Verify Code
              </ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Resend code in {resendTimer}s
            </ThemedText>
          ) : (
            <Pressable onPress={handleResend}>
              <ThemedText type="smallBold" style={{ color: '#e50914' }}>
                Resend verification code
              </ThemedText>
            </Pressable>
          )}
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
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    fontSize: 26,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
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
  otpSection: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  codeInputField: {
    width: 200,
    height: 54,
    borderRadius: 8,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  verifyBtn: {
    height: 48,
    alignSelf: 'stretch',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
