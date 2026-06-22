import React, { useState } from 'react';
import {
  StyleSheet, View, Image, Pressable, ScrollView,
  TextInput, useColorScheme, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon, Shield, CreditCard, Laptop, LogOut, Check,
  Smartphone, ShieldCheck, ToggleLeft, ToggleRight, Sparkles, Film,
  Play, Bell, Globe, ChevronRight, Star, Award, Download, Clock,
} from 'lucide-react-native';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useDownloadStore } from '../store/useDownloadStore';
import { SUBSCRIPTION_PLANS, MOCK_VIDEOS } from '../constants/mockData';
import { SubscriptionPlan, UserRole } from '../types';

type PayMethod = 'STRIPE' | 'PAYPAL' | 'MPESA' | 'APPLE_PAY' | 'GOOGLE_PAY';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#555',
  BASIC: '#1565c0',
  PREMIUM: '#e1ad01',
  FAMILY: '#7b1fa2',
  STUDENT: '#00897b',
};

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user, logout, enableBiometrics, terminateDeviceSession, updateRole } = useAuthStore();
  const { subscription, purchasePlan, cancelSubscription } = useSubscriptionStore();
  const { tasks } = useDownloadStore();

  const downloadedTasks = Object.values(tasks).filter((t) => t.status === 'COMPLETED');
  const totalDownloadedMB = Math.round(
    Object.values(tasks).filter((t) => t.status === 'COMPLETED')
      .reduce((acc, t) => acc + t.sizeBytes, 0) / (1024 * 1024)
  );

  const getPoster = (videoId: string, fallbackUrl: string) => {
    const video = MOCK_VIDEOS.find((v) => v.id === videoId);
    return video?.posterUrl || fallbackUrl;
  };

  const [activeMfa, setActiveMfa] = useState(user?.mfaEnabled || false);
  const [activeBiometrics, setActiveBiometrics] = useState(user?.biometricsEnabled || false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('STRIPE');
  const [phoneMpesa, setPhoneMpesa] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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
        phoneNumber: paymentMethod === 'MPESA' ? phoneMpesa : undefined,
      });
      if (success) {
        setShowBillingModal(false);
        alert(`✅ Successfully upgraded to ${selectedPlan} Plan!`);
      }
    } catch (e: any) {
      alert(e.message || 'Payment processing error');
    } finally {
      setPurchasing(false);
    }
  };

  const triggerCancel = async () => {
    if (confirm('Cancel your auto-renewing subscription? You will lose premium access at period end.')) {
      await cancelSubscription();
      alert('Subscription cancelled. You have access until the end of this billing period.');
    }
  };

  const planColor = PLAN_COLORS[subscription.plan] || '#555';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {user ? (
          <>
            {/* ── User Hero Card ─────────────────────────────────── */}
            <View style={styles.userHeroCard}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                <View style={[styles.planRing, { borderColor: planColor }]} />
              </View>
              <View style={styles.userMeta}>
                <ThemedText type="title" style={styles.displayName}>{user.displayName}</ThemedText>
                <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 12 }}>{user.email}</ThemedText>
                <View style={styles.badgeRow}>
                  <View style={[styles.roleBadge, { backgroundColor: '#e50914' }]}>
                    <ThemedText type="code" style={styles.badgeText}>{user.role}</ThemedText>
                  </View>
                  {subscription.plan !== 'FREE' && (
                    <View style={[styles.roleBadge, { backgroundColor: planColor }]}>
                      <Star size={8} color="#fff" fill="#fff" />
                      <ThemedText type="code" style={styles.badgeText}>{subscription.plan}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ── Stats Strip ─────────────────────────────────────── */}
            <View style={[styles.statsStrip, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.statCell}>
                <Download size={16} color="#e50914" />
                <ThemedText type="smallBold" style={styles.statNum}>{downloadedTasks.length}</ThemedText>
                <ThemedText type="code" style={[styles.statLabel, { color: colors.textSecondary }]}>Downloads</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border || '#333' }]} />
              <View style={styles.statCell}>
                <Clock size={16} color="#e1ad01" />
                <ThemedText type="smallBold" style={styles.statNum}>{totalDownloadedMB}MB</ThemedText>
                <ThemedText type="code" style={[styles.statLabel, { color: colors.textSecondary }]}>Stored</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border || '#333' }]} />
              <View style={styles.statCell}>
                <Award size={16} color="#00c853" />
                <ThemedText type="smallBold" style={styles.statNum}>{subscription.plan}</ThemedText>
                <ThemedText type="code" style={[styles.statLabel, { color: colors.textSecondary }]}>Plan</ThemedText>
              </View>
            </View>

            {/* ── My Movie Box ────────────────────────────────────── */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeading}>
                <Film size={18} color="#e50914" />
                <ThemedText type="smallBold" style={styles.cardTitle}>My Movie Box</ThemedText>
                <Pressable onPress={() => router.push('/downloads')} style={styles.cardAction}>
                  <ThemedText type="code" style={{ color: '#e50914', fontSize: 11, fontWeight: '700' }}>Manage</ThemedText>
                  <ChevronRight size={12} color="#e50914" />
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
                        onPress={() => router.push({ pathname: '/watch/[id]', params: { id: task.videoId, isOffline: 'true', localUri: task.localUri || '' } } as any)}
                        style={styles.shelfCard}
                      >
                        <View style={styles.shelfPoster}>
                          <Image source={{ uri: poster }} style={styles.shelfPosterImg} />
                          <View style={styles.offlineTag}>
                            <Check size={7} color="#000" strokeWidth={4} />
                            <ThemedText type="code" style={styles.offlineTagText}>OFFLINE</ThemedText>
                          </View>
                          <View style={styles.shelfPlayOverlay}>
                            <Play size={14} color="#fff" fill="#fff" />
                          </View>
                        </View>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.shelfTitle}>
                          {task.title}
                        </ThemedText>
                        <ThemedText type="code" style={[styles.shelfMeta, { color: colors.textSecondary }]}>
                          {videoDetail?.year || 2026} · {videoDetail?.genre || 'Movie'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyShelf}>
                  <Film size={38} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <ThemedText type="smallBold" style={{ color: colors.textSecondary }}>Your Movie Box is empty</ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 11 }}>
                    Download films & series for offline watching.
                  </ThemedText>
                  <Pressable onPress={() => router.push('/explore')} style={styles.emptyShelfBtn}>
                    <ThemedText type="code" style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Browse Content</ThemedText>
                  </Pressable>
                </View>
              )}
            </ThemedView>

            {/* ── Subscription & Billing ─────────────────────────── */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeading}>
                <CreditCard size={18} color={colors.textSecondary} />
                <ThemedText type="smallBold" style={styles.cardTitle}>Subscription & Billing</ThemedText>
              </View>

              <View style={[styles.activePlanBanner, { borderColor: planColor }]}>
                <View style={[styles.planColorDot, { backgroundColor: planColor }]} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                    {subscription.plan === 'FREE' ? 'Free Plan' : `${subscription.plan} Plan`}
                  </ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {subscription.status} · Renews {new Date(subscription.expiresAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                {subscription.plan !== 'FREE' && (
                  <Pressable onPress={triggerCancel}>
                    <ThemedText type="code" style={{ color: '#f44336', fontSize: 11 }}>Cancel</ThemedText>
                  </Pressable>
                )}
              </View>

              <ThemedText type="smallBold" style={{ marginTop: 6, fontSize: 12 }}>Upgrade Plan</ThemedText>
              {SUBSCRIPTION_PLANS.filter((p) => p.id !== subscription.plan).map((plan) => (
                <Pressable key={plan.id} onPress={() => triggerUpgrade(plan.id as SubscriptionPlan)} style={[styles.planCard, { borderColor: PLAN_COLORS[plan.id] || '#333' }]}>
                  <View style={styles.planCardLeft}>
                    <View style={[styles.planDot, { backgroundColor: PLAN_COLORS[plan.id] }]} />
                    <View>
                      <ThemedText type="smallBold" style={{ fontSize: 13 }}>{plan.name}</ThemedText>
                      <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                        {plan.features[0]}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.planCardRight}>
                    <ThemedText type="smallBold" style={{ color: PLAN_COLORS[plan.id], fontSize: 14 }}>
                      ${plan.price}
                    </ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 9 }}>/mo</ThemedText>
                  </View>
                </Pressable>
              ))}
            </ThemedView>

            {/* ── Security & Biometrics ──────────────────────────── */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeading}>
                <ShieldCheck size={18} color={colors.textSecondary} />
                <ThemedText type="smallBold" style={styles.cardTitle}>Security & Biometrics</ThemedText>
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleMeta}>
                  <ThemedText type="smallBold" style={{ fontSize: 13 }}>Multi-Factor Authentication</ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 11 }}>
                    Require 6-digit OTP code at login
                  </ThemedText>
                </View>
                <Pressable onPress={() => setActiveMfa((v) => !v)}>
                  {activeMfa ? <ToggleRight size={32} color="#e50914" /> : <ToggleLeft size={32} color={colors.textSecondary} />}
                </Pressable>
              </View>
              <View style={[styles.toggleRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.backgroundSelected }]}>
                <View style={styles.toggleMeta}>
                  <ThemedText type="smallBold" style={{ fontSize: 13 }}>Biometric Login</ThemedText>
                  <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 11 }}>
                    Face ID / fingerprint authentication
                  </ThemedText>
                </View>
                <Pressable onPress={handleBiometricToggle}>
                  {activeBiometrics ? <ToggleRight size={32} color="#e50914" /> : <ToggleLeft size={32} color={colors.textSecondary} />}
                </Pressable>
              </View>
            </ThemedView>

            {/* ── Connected Devices ──────────────────────────────── */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeading}>
                <Laptop size={18} color={colors.textSecondary} />
                <ThemedText type="smallBold" style={styles.cardTitle}>Connected Devices ({user.devices.length})</ThemedText>
              </View>
              {user.devices.map((device, i) => (
                <View key={device.id} style={[styles.deviceRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.backgroundSelected }]}>
                  <Smartphone size={16} color={device.current ? '#e50914' : colors.textSecondary} />
                  <View style={styles.deviceMeta}>
                    <ThemedText type="smallBold" style={{ fontSize: 13 }}>{device.name}</ThemedText>
                    <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {device.current ? '✅ This device' : device.lastActive}
                    </ThemedText>
                  </View>
                  {!device.current && (
                    <Pressable onPress={() => terminateDeviceSession(device.id)} style={styles.deviceSignOut}>
                      <ThemedText type="code" style={{ color: '#f44336', fontSize: 11, fontWeight: '700' }}>Sign Out</ThemedText>
                    </Pressable>
                  )}
                </View>
              ))}
            </ThemedView>

            {/* ── Developer Sandbox ──────────────────────────────── */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeading}>
                <Shield size={18} color={colors.textSecondary} />
                <ThemedText type="smallBold" style={styles.cardTitle}>Sandbox (Dev Roles)</ThemedText>
              </View>
              <View style={styles.roleRow}>
                {(['USER', 'CREATOR', 'MODERATOR', 'ADMIN'] as UserRole[]).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => updateRole(role)}
                    style={[
                      styles.roleBtn,
                      { backgroundColor: user.role === role ? '#e50914' : colors.backgroundSelected }
                    ]}
                  >
                    <ThemedText type="code" style={{ color: user.role === role ? '#fff' : colors.textSecondary, fontSize: 11 }}>
                      {role}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            {/* ── Logout ─────────────────────────────────────────── */}
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut size={18} color="#ffffff" />
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Sign Out</ThemedText>
            </Pressable>
          </>
        ) : (
          /* ── Guest State ──────────────────────────────────────── */
          <ThemedView type="backgroundElement" style={styles.guestCard}>
            <UserIcon size={48} color={colors.textSecondary} />
            <ThemedText type="smallBold" style={{ fontSize: 18 }}>Browsing as Guest</ThemedText>
            <ThemedText type="code" style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
              Sign in to unlock downloads, playlists, recommendations, and more.
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
              <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 14 }}>Sign In / Sign Up</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ScrollView>

      {/* Billing Modal */}
      {showBillingModal && selectedPlan && (
        <View style={styles.modalBg}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Sparkles size={22} color="#e1ad01" fill="#e1ad01" />
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>Upgrade to {selectedPlan}</ThemedText>
            </View>
            <ThemedText type="code" style={{ color: colors.textSecondary }}>
              ${SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)?.price}/month · Cancel anytime
            </ThemedText>

            <View style={styles.payMethodRow}>
              {(['STRIPE', 'PAYPAL', 'MPESA'] as const).map((method) => (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[styles.payMethodBtn, { backgroundColor: paymentMethod === method ? '#e50914' : colors.backgroundSelected }]}
                >
                  <ThemedText type="code" style={{ color: paymentMethod === method ? '#fff' : colors.textSecondary, fontSize: 11 }}>
                    {method}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {paymentMethod === 'MPESA' && (
              <TextInput
                placeholder="+254 712 345 678"
                placeholderTextColor={colors.textSecondary}
                value={phoneMpesa}
                onChangeText={setPhoneMpesa}
                keyboardType="phone-pad"
                style={[styles.phoneInput, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
              />
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowBillingModal(false)} style={styles.modalCancel}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={executeUpgrade} style={[styles.modalCheckout, { backgroundColor: '#e50914' }]}>
                {purchasing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <ThemedText type="smallBold" style={{ color: '#fff' }}>Pay & Upgrade</ThemedText>
                }
              </Pressable>
            </View>
          </ThemedView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },

  // User hero
  userHeroCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  avatarWrapper: { position: 'relative', width: 72, height: 72 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#333' },
  planRing: { position: 'absolute', inset: -3, borderRadius: 39, borderWidth: 2.5 },
  userMeta: { flex: 1, gap: 3 },
  displayName: { fontSize: 20, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row', borderRadius: 12,
    paddingVertical: Spacing.two, marginBottom: 4,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: '60%', alignSelf: 'center' },
  statNum: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10 },

  // Cards
  card: { padding: Spacing.three, borderRadius: 12, gap: Spacing.two },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14 },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  // Movie shelf
  movieShelf: { flexDirection: 'row', gap: Spacing.two, paddingVertical: 4 },
  shelfCard: { width: 96, gap: 4 },
  shelfPoster: { position: 'relative', width: 96, aspectRatio: 2 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  shelfPosterImg: { width: '100%', height: '100%' },
  offlineTag: {
    position: 'absolute', top: 4, left: 4, backgroundColor: '#00c853',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3,
    paddingVertical: 1, borderRadius: 3, gap: 2, zIndex: 5,
  },
  offlineTagText: { color: '#000', fontSize: 7, fontWeight: '900' },
  shelfPlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  shelfTitle: { fontSize: 11 },
  shelfMeta: { fontSize: 9 },
  emptyShelf: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyShelfBtn: { backgroundColor: '#e50914', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 6, marginTop: 4 },

  // Subscription
  activePlanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.two, borderRadius: 8, borderWidth: 1,
  },
  planColorDot: { width: 10, height: 10, borderRadius: 5 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.two, borderRadius: 8, borderWidth: 1,
  },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  planDot: { width: 8, height: 8, borderRadius: 4 },
  planCardRight: { alignItems: 'flex-end' },

  // Security toggles
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  toggleMeta: { flex: 1, paddingRight: Spacing.three },

  // Devices
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 8 },
  deviceMeta: { flex: 1 },
  deviceSignOut: { padding: 4 },

  // Sandbox roles
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },

  logoutBtn: {
    flexDirection: 'row', backgroundColor: '#c62828',
    height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 10,
  },

  // Guest
  guestCard: { padding: Spacing.five, borderRadius: 12, alignItems: 'center', gap: Spacing.two },
  loginBtn: { backgroundColor: '#e50914', paddingVertical: 12, paddingHorizontal: Spacing.five, borderRadius: 8, marginTop: 4 },

  // Billing Modal
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.four },
  modalCard: { padding: Spacing.four, borderRadius: 12, gap: Spacing.two },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payMethodRow: { flexDirection: 'row', gap: Spacing.two },
  payMethodBtn: { flex: 1, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  phoneInput: { height: 46, borderRadius: 8, paddingHorizontal: Spacing.three },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: Spacing.three },
  modalCheckout: { paddingVertical: 10, paddingHorizontal: Spacing.four, borderRadius: 6, justifyContent: 'center', alignItems: 'center', minWidth: 120 },
});
