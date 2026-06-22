import React, { useState, useEffect, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function RatingBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  return (
    <View style={styles.ratingBadge}>
      <ThemedText type="code" style={styles.ratingText}>{rating}</ThemedText>
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
          <ChevronRight size={12} color="#e50914" />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { user, isAuthenticated } = useAuthStore();
  const { playbackProgress } = usePlayerStore();

  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [liveStreams, setLiveStreams] = useState<Video[]>([]);
  const [continueVideos, setContinueVideos] = useState<(Video & { progress: number })[]>([]);

  // Hero fade-in animation
  const heroOpacity = useRef(new Animated.Value(0)).current;

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
          Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        }
        setRecommendedVideos(recommended.slice(0, 8));
        setLiveStreams(live);

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
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playbackProgress]);

  const handleWatch = (video: Video) => {
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
  };

  const renderVideoCard = ({ item }: { item: Video }) => (
    <Pressable onPress={() => handleWatch(item)} style={styles.cardPressable}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: item.posterUrl || item.thumbnailUrl }} style={styles.cardImage} />
        {item.tier === 'PREMIUM' && (
          <View style={styles.premiumBadge}>
            <ThemedText type="code" style={styles.premiumBadgeText}>PREMIUM</ThemedText>
          </View>
        )}
        <View style={styles.resolutionOverlay}>
          <ThemedText type="code" style={styles.resolutionOverlayText}>{item.resolution}</ThemedText>
        </View>
        <View style={styles.cardPlayOverlay}>
          <Play size={16} color="#fff" fill="#fff" />
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>{item.title}</ThemedText>
      <View style={styles.cardMeta}>
        <Star size={9} color="#e1ad01" fill="#e1ad01" />
        <ThemedText type="code" style={styles.cardGenre}>
          {item.year || 2026} · {item.genre}
        </ThemedText>
      </View>
    </Pressable>
  );

  const renderContinueCard = ({ item }: { item: Video & { progress: number } }) => (
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
  );

  const renderLiveCard = ({ item }: { item: Video }) => (
    <Pressable onPress={() => handleWatch(item)} style={styles.liveCard}>
      <View style={styles.liveThumbnailWrap}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.liveImage} />
        <View style={styles.livePulse}>
          <View style={styles.liveDot} />
          <ThemedText type="code" style={styles.livePulseText}>LIVE</ThemedText>
        </View>
        <View style={styles.liveViewerCount}>
          <ThemedText type="code" style={styles.liveViewerText}>
            {formatViews(item.liveViewerCount || 0)} watching
          </ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.liveCardTitle}>{item.title}</ThemedText>
      <ThemedText type="code" numberOfLines={1} style={[styles.liveCardCreator, { color: colors.textSecondary }]}>
        {item.creatorName}
      </ThemedText>
    </Pressable>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <ThemedText type="code" style={{ color: colors.textSecondary, marginTop: 12 }}>
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
          <Animated.View style={{ opacity: heroOpacity }}>
            <ImageBackground
              source={{ uri: featuredVideo.backdropUrl || featuredVideo.thumbnailUrl }}
              style={styles.heroBackground}
              resizeMode="cover"
            >
              {/* Multi-layer gradient for cinematic depth */}
              <View style={styles.heroGradientTop} />
              <View style={styles.heroGradient}>
                <View style={styles.heroDetails}>
                  <View style={styles.heroBadgeRow}>
                    <Flame size={13} color="#e50914" fill="#e50914" />
                    <ThemedText type="code" style={styles.heroBadgeText}>#1 IN YOUR COUNTRY TODAY</ThemedText>
                    <View style={styles.heroDivider} />
                    <RatingBadge rating={featuredVideo.rating} />
                    <ThemedText type="code" style={styles.heroYearText}>{featuredVideo.year}</ThemedText>
                  </View>

                  <ThemedText type="title" style={styles.heroTitle} numberOfLines={2}>
                    {featuredVideo.title}
                  </ThemedText>

                  {featuredVideo.cast && featuredVideo.cast.length > 0 && (
                    <ThemedText type="code" style={styles.heroCast} numberOfLines={1}>
                      {featuredVideo.cast.slice(0, 3).join(' · ')}
                    </ThemedText>
                  )}

                  <ThemedText type="small" style={styles.heroDesc} numberOfLines={2}>
                    {featuredVideo.description}
                  </ThemedText>

                  <View style={styles.heroGenreRow}>
                    {[featuredVideo.genre, featuredVideo.resolution].map((tag) => (
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
                      <Play size={18} color="#000000" fill="#000000" />
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
              icon={<Radio size={15} color="#e50914" />}
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
            />
          </View>
        )}

        {/* Continue Watching */}
        {continueVideos.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon={<Clock size={15} color="#e1ad01" />}
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
            icon={<TrendingUp size={15} color="#e50914" />}
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

        {/* AI Recommendations */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Award size={15} color="#e1ad01" />}
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
            <ThemedText type="smallBold" style={styles.promoTitle}>Start Your Free Trial</ThemedText>
            <ThemedText type="code" style={styles.promoSub}>
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
  container: { flex: 1 },
  scrollContent: { paddingBottom: BottomTabInset + Spacing.four },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  guestBanner: {
    backgroundColor: '#e50914',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestBannerText: { color: '#ffffff', fontSize: 11, flex: 1 },

  heroBackground: { width: '100%', height: 480, justifyContent: 'flex-end' },
  heroGradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
  } as any,
  heroDetails: { padding: Spacing.four, paddingBottom: Spacing.three, gap: 6 },

  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: '#e50914', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroYearText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  ratingBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  ratingText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  heroCast: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  heroDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 17 },

  heroGenreRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  heroGenreChip: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  heroGenreChipText: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  heroActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  heroPlayButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, paddingHorizontal: Spacing.four,
    borderRadius: 6, flex: 1, backgroundColor: '#ffffff',
  },
  heroPlayText: { color: '#000000', fontSize: 15, fontWeight: '700' },
  heroInfoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, paddingHorizontal: Spacing.four,
    borderRadius: 6, flex: 1, backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroInfoText: { color: '#ffffff' },

  section: { marginTop: Spacing.four, gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.three,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: '#e50914', fontSize: 11, fontWeight: '700' },

  horizontalList: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  // Video cards
  cardPressable: { width: 120, gap: 5 },
  posterContainer: {
    position: 'relative', width: 120, aspectRatio: 2 / 3,
    borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a2e',
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  cardImage: { width: '100%', height: '100%' },
  premiumBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#e1ad01', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3,
  },
  premiumBadgeText: { color: '#000', fontSize: 7, fontWeight: '900' },
  resolutionOverlay: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
  },
  resolutionOverlayText: { color: '#fff', fontSize: 7 },
  cardPlayOverlay: {
    position: 'absolute', bottom: 5, left: 5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(229,9,20,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardGenre: { color: '#888', fontSize: 10 },

  // Continue watching
  continueCard: { width: 168, gap: 5 },
  continueThumbnailContainer: {
    position: 'relative', width: 168, aspectRatio: 16 / 9,
    borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a2e',
  },
  continueImage: { width: '100%', height: '100%' },
  continuePlayBtn: {
    position: 'absolute', alignSelf: 'center', top: '28%',
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(229,9,20,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  continueProgressBg: {
    position: 'absolute', bottom: 0, width: '100%', height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  continueProgressFill: { height: '100%', backgroundColor: '#e50914' },
  continueTimeLeft: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3,
  },
  continueTimeText: { color: '#fff', fontSize: 8 },
  continueTitle: { fontSize: 12, fontWeight: '700' },

  // Live cards
  liveCard: { width: 200, gap: 5 },
  liveThumbnailWrap: {
    position: 'relative', width: 200, aspectRatio: 16 / 9,
    borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a2e',
  },
  liveImage: { width: '100%', height: '100%' },
  livePulse: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#e50914', flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePulseText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  liveViewerCount: {
    position: 'absolute', bottom: 7, left: 7,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
  },
  liveViewerText: { color: '#fff', fontSize: 9 },
  liveCardTitle: { fontSize: 12, fontWeight: '700' },
  liveCardCreator: { fontSize: 10 },

  // Promo strip
  promoStrip: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.four,
    borderRadius: 12,
    padding: Spacing.four,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)',
    gap: 6,
    alignItems: 'center',
  },
  promoTitle: { fontSize: 18, color: '#fff', fontWeight: '900', textAlign: 'center' },
  promoSub: { color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  promoBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 10, paddingHorizontal: 32,
    borderRadius: 6, marginTop: 6,
  },
});
