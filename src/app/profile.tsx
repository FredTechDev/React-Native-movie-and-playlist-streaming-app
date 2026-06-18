import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, ScrollView, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User as UserIcon, Shield, CreditCard, Laptop, LogOut, Check, 
  Smartphone, ShieldCheck, ToggleLeft, ToggleRight, Sparkles, Film, Play 
} from 'lucide-react-native';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useDownloadStore } from '../store/useDownloadStore';
import { SUBSCRIPTION_PLANS, MOCK_VIDEOS } from '../constants/mockData';
import { SubscriptionPlan, UserRole } from '../types';

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user, logout, enableBiometrics, terminateDeviceSession, updateRole } = useAuthStore();
  const { subscription, purchasePlan, cancelSubscription } = useSubscriptionStore();
  const { tasks } = useDownloadStore();

  const downloadedTasks = Object.values(tasks).filter((t) => t.status === 'COMPLETED');

  const getPoster = (videoId: string, fallbackUrl: string) => {
    const video = MOCK_VIDEOS.find((v) => v.id === videoId);
    return video?.posterUrl || fallbackUrl;
  };

  const [activeMfa, setActiveMfa] = useState(user?.mfaEnabled || false);
  const [activeBiometrics, setActiveBiometrics] = useState(user?.biometricsEnabled || false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL' | 'MPESA' | 'APPLE_PAY' | 'GOOGLE_PAY'>('STRIPE');
  const [phoneMpesa, setPhoneMpesa] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleMfaToggle = () => {
    setActiveMfa(!activeMfa);
    alert(`MFA verification setting updated!`);
  };

  const handleBiometricToggle = async () => {
    const nextVal = !activeBiometrics;
    setActiveBiometrics(nextVal);
    await enableBiometrics(nextVal);
  };

  const triggerUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowBillingModal(true);
  };

  const executeUpgrade = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      const success = await purchasePlan(selectedPlan, paymentMethod, { 
        phoneNumber: paymentMethod === 'MPESA' ? phoneMpesa : undefined 
      });
      if (success) {
        setShowBillingModal(false);
        alert(`Successfully upgraded to ${selectedPlan} Plan!`);
      }
    } catch (e: any) {
      alert(e.message || 'Payment processing error');
    } finally {
      setPurchasing(false);
    }
  };

  const triggerCancel = async () => {
    if (confirm('Cancel your auto-renewing subscription? You will lose premium access.')) {
      await cancelSubscription();
      alert('Subscription cancelled.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card Header */}
        {user ? (
          <>
            <ThemedView type="backgroundElement" style={styles.userHeaderCard}>
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              <View style={styles.userMeta}>
                <ThemedText type="title">{user.displayName}</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>{user.email}</ThemedText>
                
                {/* Role Indicator Badge */}
                <View style={styles.roleBadgeContainer}>
                  <View style={[styles.roleBadge, { backgroundColor: '#e50914' }]}>
                    <ThemedText type="code" style={styles.roleBadgeText}>{user.role}</ThemedText>
                  </View>
                  {subscription.plan !== 'FREE' && (
                    <View style={[styles.roleBadge, { backgroundColor: '#e1ad01' }]}>
                      <ThemedText type="code" style={styles.roleBadgeText}>{subscription.plan} SUBSCRIBER</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </ThemedView>

            {/* My Movie Box (Offline Locker) */}
            <ThemedView type="backgroundElement" style={styles.movieBoxCard}>
              <View style={styles.movieBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Film size={18} color="#e50914" />
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>My Movie Box</ThemedText>
                </View>
                <Pressable onPress={() => router.push('/downloads')}>
                  <ThemedText type="code" style={{ color: '#e50914', fontWeight: 'bold', fontSize: 11 }}>
                    Manage Box
                  </ThemedText>
                </Pressable>
              </View>

              {downloadedTasks.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieShelf}>
                  {downloadedTasks.map((task) => {
                    const poster = getPoster(task.videoId, task.thumbnailUrl);
                    const videoDetail = MOCK_VIDEOS.find((v) => v.id === task.videoId);
                    return (
                      <Pressable
                        key={task.id}
                        onPress={() =>
                          router.push({
                            pathname: '/watch/[id]',
                            params: { id: task.videoId, isOffline: 'true', localUri: task.localUri || '' },
                          } as any)
                        }
                        style={styles.shelfMovieCard}
                      >
                        <View style={styles.shelfPosterContainer}>
                          <Image source={{ uri: poster }} style={styles.shelfPoster} />
                          <View style={styles.offlineTag}>
                            <Check size={8} color="#000000" strokeWidth={4} />
                            <ThemedText type="code" style={styles.offlineTagText}>OFFLINE</ThemedText>
                          </View>
                          <View style={styles.shelfPlayOverlay}>
                            <Play size={16} color="#ffffff" fill="#ffffff" />
                          </View>
                        </View>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.shelfMovieTitle}>
                          {task.title}
                        </ThemedText>
                        <ThemedText type="code" style={styles.shelfMovieMeta}>
                          {videoDetail?.year || 2026} • {videoDetail?.genre || 'Movie'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyShelfContainer}>
                  <Film size={40} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                  <ThemedText type="smallBold" style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Your Digital Movie Box is empty
                  </ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, textAlign: 'center', marginHorizontal: 20, fontSize: 10 }}>
                    Download movies to watch anywhere offline with zero cellular data.
                  </ThemedText>
                  <Pressable onPress={() => router.push('/explore')} style={styles.discoverBtn}>
                    <ThemedText type="code" style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 11 }}>
                      Discover Movies
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </ThemedView>
          </>
        ) : (
          <ThemedView type="backgroundElement" style={styles.guestCard}>
            <UserIcon size={36} color={colors.textSecondary} />
            <ThemedText type="smallBold">You are browsing as Guest</ThemedText>
            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Sign In / Sign Up</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {/* Developer Sandbox - Toggle User Roles */}
        {user && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeading}>
              <Shield size={18} color={colors.textSecondary} />
              <ThemedText type="smallBold">Sandbox (Simulator Settings)</ThemedText>
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Change mock security groups to test moderation panels or creator studios:
            </ThemedText>
            <View style={styles.roleRow}>
              {(['USER', 'CREATOR', 'MODERATOR', 'ADMIN'] as UserRole[]).map((role) => (
                <Pressable
                  key={role}
                  onPress={() => updateRole(role)}
                  style={[
                    styles.roleToggleBtn,
                    user.role === role && styles.roleToggleBtnActive,
                    { backgroundColor: colors.backgroundSelected }
                  ]}
                >
                  <ThemedText type="code" style={{ color: user.role === role ? '#ffffff' : colors.textSecondary }}>
                    {role}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Subscription Plan billing Section */}
        {user && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeading}>
              <CreditCard size={18} color={colors.textSecondary} />
              <ThemedText type="smallBold">Monetization & Subscriptions</ThemedText>
            </View>

            <View style={styles.activePlanSummary}>
              <ThemedText type="small">
                Current Plan:{' '}
                <ThemedText type="smallBold" style={{ color: subscription.plan === 'FREE' ? colors.text : '#e1ad01' }}>
                  {subscription.plan}
                </ThemedText>
              </ThemedText>
              <ThemedText type="code" style={{ color: colors.textSecondary }}>
                Status: {subscription.status} • Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
              </ThemedText>

              {subscription.plan !== 'FREE' && (
                <Pressable onPress={triggerCancel} style={styles.cancelLink}>
                  <ThemedText type="code" style={{ color: '#f44336' }}>Cancel Auto-Renew</ThemedText>
                </Pressable>
              )}
            </View>

            {/* List Tiers */}
            <ThemedText type="smallBold" style={{ marginTop: Spacing.two, marginBottom: 4 }}>
              Available Upgrades
            </ThemedText>
            <View style={styles.tiersGrid}>
              {SUBSCRIPTION_PLANS.filter((p) => p.id !== subscription.plan).map((plan) => (
                <View key={plan.id} style={styles.tierPlanCard}>
                  <View style={styles.tierPlanHeader}>
                    <ThemedText type="smallBold">{plan.name}</ThemedText>
                    <ThemedText type="code" style={{ color: '#e1ad01', fontWeight: 'bold' }}>
                      ${plan.price}/{plan.billingPeriod}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.tierPlanDesc} numberOfLines={2}>
                    {plan.features.join(', ')}
                  </ThemedText>
                  <Pressable onPress={() => triggerUpgrade(plan.id as any)} style={styles.tierPlanUpgradeBtn}>
                    <ThemedText type="code" style={{ color: '#ffffff' }}>Select</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Device session lists */}
        {user && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeading}>
              <Laptop size={18} color={colors.textSecondary} />
              <ThemedText type="smallBold">Connected Devices ({user.devices.length})</ThemedText>
            </View>
            <View style={styles.devicesList}>
              {user.devices.map((device) => (
                <View key={device.id} style={styles.deviceRow}>
                  <Smartphone size={16} color={colors.text} />
                  <View style={styles.deviceMeta}>
                    <ThemedText type="smallBold">{device.name}</ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary }}>{device.lastActive}</ThemedText>
                  </View>
                  {!device.current && (
                    <Pressable onPress={() => terminateDeviceSession(device.id)} style={styles.deviceKillBtn}>
                      <ThemedText type="code" style={{ color: '#f44336' }}>Sign Out</ThemedText>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Security configuration */}
        {user && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeading}>
              <ShieldCheck size={18} color={colors.textSecondary} />
              <ThemedText type="smallBold">Security & Biometrics</ThemedText>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleMeta}>
                <ThemedText type="smallBold">Multi-Factor Authentication (MFA)</ThemedText>
                <ThemedText type="code" style={{ color: colors.textSecondary }}>
                  Require 6-digit OTP code during logins.
                </ThemedText>
              </View>
              <Pressable onPress={handleMfaToggle}>
                {activeMfa ? <ToggleRight size={32} color="#e50914" /> : <ToggleLeft size={32} color={colors.textSecondary} />}
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleMeta}>
                <ThemedText type="smallBold">Biometric Verification</ThemedText>
                <ThemedText type="code" style={{ color: colors.textSecondary }}>
                  Log in securely with Face ID or fingerprint scanner.
                </ThemedText>
              </View>
              <Pressable onPress={handleBiometricToggle}>
                {activeBiometrics ? <ToggleRight size={32} color="#e50914" /> : <ToggleLeft size={32} color={colors.textSecondary} />}
              </Pressable>
            </View>
          </ThemedView>
        )}

        {/* Logout button */}
        {user && (
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} color="#ffffff" />
            <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Sign Out Account</ThemedText>
          </Pressable>
        )}
      </ScrollView>

      {/* Billing Payment modal */}
      {showBillingModal && selectedPlan && (
        <View style={styles.modalBg}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Sparkles size={20} color="#e1ad01" fill="#e1ad01" />
              <ThemedText type="smallBold">Upgrade Plan: {selectedPlan}</ThemedText>
            </View>

            {/* Payment options selection */}
            <View style={styles.paymentMethodRow}>
              {(['STRIPE', 'PAYPAL', 'MPESA'] as const).map((method) => (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.payMethodBtn,
                    paymentMethod === method && styles.activePayMethodBtn,
                    { backgroundColor: colors.backgroundSelected }
                  ]}
                >
                  <ThemedText type="code" style={{ color: paymentMethod === method ? '#ffffff' : colors.textSecondary }}>
                    {method}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Mpesa prompt fields */}
            {paymentMethod === 'MPESA' && (
              <View style={styles.mpesaForm}>
                <ThemedText type="small">Enter Phone Number to receive STK Pin prompt:</ThemedText>
                <TextInput
                  placeholder="+254 712 345 678"
                  placeholderTextColor={colors.textSecondary}
                  value={phoneMpesa}
                  onChangeText={setPhoneMpesa}
                  keyboardType="phone-pad"
                  style={[styles.phoneInput, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
                />
              </View>
            )}

            {paymentMethod === 'STRIPE' && (
              <View style={styles.cardDetailsBox}>
                <ThemedText type="code" style={{ color: colors.textSecondary }}>
                  Simulated secure Stripe payment vault will open on checkout.
                </ThemedText>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowBillingModal(false)} style={styles.modalCancel}>
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={executeUpgrade} style={[styles.modalCheckout, { backgroundColor: '#e50914' }]}>
                {purchasing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Check Out</ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  movieBoxCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  movieBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieShelf: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: 4,
  },
  shelfMovieCard: {
    width: 100,
    gap: 4,
  },
  shelfPosterContainer: {
    position: 'relative',
    width: 100,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  shelfPoster: {
    width: '100%',
    height: '100%',
  },
  offlineTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
    zIndex: 5,
  },
  offlineTagText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: 'bold',
  },
  shelfPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelfMovieTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  shelfMovieMeta: {
    color: '#888888',
    fontSize: 8.5,
  },
  emptyShelfContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: 6,
  },
  discoverBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 8,
    paddingHorizontal: Spacing.four,
    borderRadius: 6,
    marginTop: Spacing.two,
  },
  userHeaderCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
  },
  guestCard: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loginBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 6,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  roleToggleBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 4,
  },
  roleToggleBtnActive: {
    backgroundColor: '#e50914',
  },
  activePlanSummary: {
    gap: 4,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tiersGrid: {
    gap: Spacing.two,
  },
  tierPlanCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    gap: 4,
  },
  tierPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierPlanDesc: {
    fontSize: 10,
    color: '#888888',
  },
  tierPlanUpgradeBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  devicesList: {
    gap: Spacing.two,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceKillBtn: {
    padding: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleMeta: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#d32f2f',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    padding: Spacing.four,
    borderRadius: 8,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  payMethodBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePayMethodBtn: {
    backgroundColor: '#e50914',
  },
  mpesaForm: {
    gap: 6,
  },
  phoneInput: {
    height: 44,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
  },
  cardDetailsBox: {
    padding: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  modalCheckout: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
