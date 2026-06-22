import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, ScrollView, Image, Pressable,
  ImageBackground, useColorScheme, FlatList,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play, Info, Flame, Award, Star, Clock, TrendingUp,
  ChevronRight, Zap, Radio,
} from 'lucide-react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { BottomTabInset, Colors, Spacing } from '../constants/theme';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Video } from '../types';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function RatingBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  return (
    <View style={styles.ratingBadge}>
      <ThemedText type="metacritic">{rating}</ThemedText>
    </View>
  );
}

function SectionHeader({ icon, title, onMore }: { icon: React.ReactNode; title: string; onMore?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <ThemedText type="smallBold" style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      {onMore && (
        <Pressable onPress={onMore} style={styles.seeAllBtn}>
          <ThemedText type="code" style={styles.seeAllText}>See All</ThemedText>
          <ChevronRight size={12} color={Colors.dark.accent} />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [liveStreams, setLiveStreams] = useState<Video[]>([]);
  const [continueVideos, setContinueVideos] = useState<(Video & { progress: number })[]>([]);
  const [newReleases, setNewReleases] = useState<Video[]>([]);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1.05)).current;
  const top10Bounce = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [films, recommended, live] = await Promise.all([
          apiService.getVideos(),
          apiService.getRecommendedVideos('Sci-Fi'),
          apiService.getLiveStreams(),
        ]);

        if (films.length > 0) {
          setFeaturedVideo(films[0]);
          setTrendingVideos(films.slice(1, 8));
          setNewReleases(films.slice(8, 14));
          Animated.parallel([
            Animated.timing(heroOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(heroScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            Animated.spring(top10Bounce, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
          ]).start();
        }
        setRecommendedVideos(recommended.slice(0, 8));
        setLiveStreams(live);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [heroOpacity, heroScale, top10Bounce]);

  const playbackProgress = usePlayerStore((s) => s.playbackProgress);
  useEffect(() => {
    const updateContinue = async () => {
      const films = await apiService.getVideos();
      const listWithProgress: (Video & { progress: number })[] = [];
      for (const [vId, progressObj] of Object.entries(playbackProgress)) {
        const matched = films.find((f) => f.id === vId);
        if (matched && progressObj.duration > 0) {
          const pct = (progressObj.position / progressObj.duration) * 100;
          if (pct > 2 && pct < 97) {
            listWithProgress.push({ ...matched, progress: pct });
          }
        }
      }
      setContinueVideos(listWithProgress);
    };
    updateContinue();
  }, [playbackProgress]);

  const handleWatch = useCallback((video: Video) => {
    if (video.tier === 'PREMIUM' && (!user || user.role === 'GUEST')) {
      alert('Premium content — please sign in and upgrade to watch.');
      router.push('/(auth)/login');
      return;
    }
    if (video.isLive) {
      router.push(`/live/${video.id}`);
    } else {
      router.push(`/watch/${video.id}`);
    }
  }, [user, router]);

  const renderVideoCard = useCallback(({ item }: { item: Video }) => (
    <Pressable onPress={() => handleWatch(item)} style={styles.cardPressable}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: item.posterUrl || item.thumbnailUrl }} style={styles.cardImage} />
        <View style={styles.cardGradient} />
        {item.tier === 'PREMIUM' && (
          <View style={styles.premiumBadge}>
            <ThemedText type="code" style={styles.premiumBadgeText}>EXCLUSIVE</ThemedText>
          </View>
        )}
        <View style={styles.cardTopBadge}>
          <ThemedText type="code" style={styles.cardTopBadgeText}>{item.rating || 'NEW'}</ThemedText>
        </View>
        <View style={styles.cardPlayOverlay}>
          <Play size={14} color="#fff" fill="#fff" />
        </View>
        <View style={styles.cardMetaBottom}>
          <ThemedText type="code" style={styles.cardMetaText}>{item.year || 2026}</ThemedText>
          <View style={styles.cardMetaDot} />
          <ThemedText type="code" style={styles.cardMetaText}>{item.resolution}</ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>{item.title}</ThemedText>
      <View style={styles.cardMetaRow}>
        <Star size={8} color={Colors.dark.accentGold} fill={Colors.dark.accentGold} />
        <ThemedText type="code" style={styles.cardGenre}>{item.genre}</ThemedText>
      </View>
    </Pressable>
  ), [handleWatch]);

  const renderContinueCard = useCallback(({ item }: { item: Video & { progress: number } }) => (
    <Pressable onPress={() => handleWatch(item)} style={styles.continueCard}>
      <View style={styles.continueThumbnailContainer}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.continueImage} />
        <View style={styles.continuePlayBtn}>
          <Play size={16} color="#ffffff" fill="#ffffff" />
        </View>
        <View style={styles.continueProgressBg}>
          <View style={[styles.continueProgressFill, { width: `${item.progress}%` as any }]} />
        </View>
        <View style={styles.continueTimeLeft}>
          <ThemedText type="code" style={styles.continueTimeText}>
            {Math.round(100 - item.progress)}% left
          </ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.continueTitle}>{item.title}</ThemedText>
    </Pressable>
  ), [handleWatch]);

  const renderLiveCard = useCallback(({ item }: { item: Video }) => (
    <Pressable onPress={() => handleWatch(item)} style={styles.liveCard}>
      <View style={styles.liveThumbnailWrap}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.liveImage} />
        <View style={styles.livePulse}>
          <View style={styles.liveDot} />
          <ThemedText type="metacritic" style={styles.livePulseText}>LIVE</ThemedText>
        </View>
        <View style={styles.liveViewerCount}>
          <ThemedText type="code" style={styles.liveViewerText}>
            {formatViews(item.liveViewerCount || 0)} watching
          </ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.liveCardTitle}>{item.title}</ThemedText>
      <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textSecondary }}>
        {item.creatorName}
      </ThemedText>
    </Pressable>
  ), [handleWatch, colors.textSecondary]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
        <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 16 }}>
          Loading your feed…
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Guest Banner */}
        {!isAuthenticated && (
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.guestBanner}>
            <Zap size={14} color="#ffffff" fill="#ffffff" />
            <ThemedText type="code" style={styles.guestBannerText}>
              Sign in to unlock Premium, Downloads & Personalized Picks
            </ThemedText>
            <ChevronRight size={14} color="#ffffff" />
          </Pressable>
        )}

        {/* Cinematic Hero Banner */}
        {featuredVideo && (
          <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
            <ImageBackground
              source={{ uri: featuredVideo.backdropUrl || featuredVideo.thumbnailUrl }}
              style={styles.heroBackground}
              resizeMode="cover"
            >
              <View style={styles.heroGradientTop} />
              <View style={styles.heroGradientOverlay} />
              <View style={styles.heroGradient}>
                <View style={styles.heroDetails}>
                  <View style={styles.heroBadgeRow}>
                    <Animated.View style={{ transform: [{ scale: top10Bounce }] }}>
                      <View style={styles.top10Badge}>
                        <Flame size={12} color={Colors.dark.accent} fill={Colors.dark.accent} />
                        <ThemedText type="metacritic" style={styles.top10Text}>TOP 10</ThemedText>
                      </View>
                    </Animated.View>
                    <View style={styles.heroDivider} />
                    <RatingBadge rating={featuredVideo.rating} />
                    <ThemedText type="code" style={styles.heroYearText}>{featuredVideo.year}</ThemedText>
                    <View style={styles.heroDivider} />
                    <ThemedText type="code" style={styles.heroYearText}>{featuredVideo.resolution}</ThemedText>
                  </View>

                  <ThemedText type="heroTitle" style={styles.heroTitle} numberOfLines={2}>
                    {featuredVideo.title}
                  </ThemedText>

                  {featuredVideo.cast && featuredVideo.cast.length > 0 && (
                    <ThemedText type="caption" style={styles.heroCast} numberOfLines={1}>
                      Starring {featuredVideo.cast.slice(0, 3).join(' · ')}
                    </ThemedText>
                  )}

                  <ThemedText type="small" style={styles.heroDesc} numberOfLines={2}>
                    {featuredVideo.description}
                  </ThemedText>

                  <View style={styles.heroGenreRow}>
                    {[featuredVideo.genre, featuredVideo.tier].map((tag) => (
                      <View key={tag} style={styles.heroGenreChip}>
                        <ThemedText type="code" style={styles.heroGenreChipText}>{tag}</ThemedText>
                      </View>
                    ))}
                  </View>

                  <View style={styles.heroActions}>
                    <Pressable
                      onPress={() => handleWatch(featuredVideo)}
                      style={styles.heroPlayButton}
                    >
                      <Play size={20} color="#000000" fill="#000000" />
                      <ThemedText type="smallBold" style={styles.heroPlayText}>Play Now</ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push(`/watch/${featuredVideo.id}`)}
                      style={styles.heroInfoButton}
                    >
                      <Info size={18} color="#ffffff" />
                      <ThemedText type="small" style={styles.heroInfoText}>More Info</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>
        )}

        {/* Live Now Section */}
        {liveStreams.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon={<Radio size={15} color={Colors.dark.accent} />}
              title="Live Now"
              onMore={() => router.push('/explore')}
            />
            <FlatList
              horizontal
              data={liveStreams}
              renderItem={renderLiveCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              removeClippedSubviews={true}
              maxToRenderPerBatch={4}
              windowSize={3}
            />
          </View>
        )}

        {/* Continue Watching */}
        {continueVideos.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon={<Clock size={15} color={Colors.dark.accentGold} />}
              title="Continue Watching"
            />
            <FlatList
              horizontal
              data={continueVideos}
              renderItem={renderContinueCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Trending Now */}
        <View style={styles.section}>
          <SectionHeader
            icon={<TrendingUp size={15} color={Colors.dark.accent} />}
            title="Trending Now"
            onMore={() => router.push('/explore')}
          />
          <FlatList
            horizontal
            data={trendingVideos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* New Releases */}
        {newReleases.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon={<Award size={15} color={Colors.dark.accentGold} />}
              title="New Releases"
              onMore={() => router.push('/explore')}
            />
            <FlatList
              horizontal
              data={newReleases}
              renderItem={renderVideoCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* AI Recommendations */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Star size={15} color={Colors.dark.accentGold} fill={Colors.dark.accentGold} />}
            title="Picked For You"
            onMore={() => router.push('/explore')}
          />
          <FlatList
            horizontal
            data={recommendedVideos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Bottom promo strip */}
        {!isAuthenticated && (
          <Pressable
            onPress={() => router.push('/(auth)/register')}
            style={styles.promoStrip}
          >
            <ThemedText type="subtitle" style={styles.promoTitle}>Start Your Free Trial</ThemedText>
            <ThemedText type="caption" style={styles.promoSub}>
              Unlimited movies, series & live streams. Cancel anytime.
            </ThemedText>
            <View style={styles.promoBtn}>
              <ThemedText type="smallBold" style={{ color: '#000' }}>Get Started</ThemedText>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { paddingBottom: BottomTabInset + Spacing.four },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },

  guestBanner: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestBannerText: { color: '#ffffff', fontSize: 11, flex: 1 },

  heroBackground: { width: '100%', height: 580, justifyContent: 'flex-end' },
  heroGradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  heroGradientOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    backgroundColor: 'transparent',
  } as any,
  heroDetails: { padding: Spacing.four, paddingBottom: Spacing.five, gap: 8 },

  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  top10Badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(229,9,20,0.2)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, borderWidth: 1, borderColor: 'rgba(229,9,20,0.4)',
  },
  top10Text: { color: Colors.dark.accent, fontSize: 10 },
  heroDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroYearText: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  ratingBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  heroTitle: { color: '#ffffff', marginTop: 4 },
  heroCast: { color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroDesc: { color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginTop: 2 },

  heroGenreRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  heroGenreChip: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4,
  },
  heroGenreChipText: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },

  heroActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  heroPlayButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: Spacing.four,
    borderRadius: 4, flex: 1, backgroundColor: '#ffffff',
  },
  heroPlayText: { color: '#000000', fontSize: 16, fontWeight: '800' },
  heroInfoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: Spacing.four,
    borderRadius: 4, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroInfoText: { color: '#ffffff' },

  section: { marginTop: Spacing.four, gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.three,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: Colors.dark.accent, fontSize: 11, fontWeight: '700' },

  horizontalList: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  cardPressable: { width: 130, gap: 6 },
  posterContainer: {
    position: 'relative', width: 130, aspectRatio: 2 / 3,
    borderRadius: 6, overflow: 'hidden', backgroundColor: '#0D0D0D',
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8,
  },
  cardGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardImage: { width: '100%', height: '100%' },
  premiumBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: Colors.dark.accentGold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2,
  },
  premiumBadgeText: { color: '#000', fontSize: 7, fontWeight: '900' },
  cardTopBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cardTopBadgeText: { color: '#fff', fontSize: 7, fontWeight: '700' },
  cardPlayOverlay: {
    position: 'absolute', bottom: 8, left: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(229,9,20,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardMetaBottom: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  cardMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 8 },
  cardMetaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  cardTitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardGenre: { color: '#666', fontSize: 10 },

  continueCard: { width: 180, gap: 6 },
  continueThumbnailContainer: {
    position: 'relative', width: 180, aspectRatio: 16 / 9,
    borderRadius: 6, overflow: 'hidden', backgroundColor: '#0D0D0D',
    shadowColor: '#000', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  continueImage: { width: '100%', height: '100%' },
  continuePlayBtn: {
    position: 'absolute', alignSelf: 'center', top: '30%',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(229,9,20,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  continueProgressBg: {
    position: 'absolute', bottom: 0, width: '100%', height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  continueProgressFill: { height: '100%', backgroundColor: Colors.dark.accent },
  continueTimeLeft: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
  },
  continueTimeText: { color: '#fff', fontSize: 9 },
  continueTitle: { fontSize: 12, fontWeight: '700' },

  liveCard: { width: 220, gap: 6 },
  liveThumbnailWrap: {
    position: 'relative', width: 220, aspectRatio: 16 / 9,
    borderRadius: 6, overflow: 'hidden', backgroundColor: '#0D0D0D',
    shadowColor: '#000', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  liveImage: { width: '100%', height: '100%' },
  livePulse: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.dark.accent, flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePulseText: { color: '#fff', fontSize: 9 },
  liveViewerCount: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3,
  },
  liveViewerText: { color: '#fff', fontSize: 9 },
  liveCardTitle: { fontSize: 13, fontWeight: '700' },

  promoStrip: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.five,
    borderRadius: 12,
    padding: Spacing.four,
    backgroundColor: '#0A0A0B',
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.25)',
    gap: 8,
    alignItems: 'center',
  },
  promoTitle: { color: '#fff', textAlign: 'center' },
  promoSub: { color: '#666', textAlign: 'center', lineHeight: 18 },
  promoBtn: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12, paddingHorizontal: 36,
    borderRadius: 4, marginTop: 8,
  },
});
