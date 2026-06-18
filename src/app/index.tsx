import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Pressable, ImageBackground, useColorScheme, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Info, Download, Heart, Flame, ShieldAlert, Award } from 'lucide-react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { BottomTabInset, Colors, Spacing } from '../constants/theme';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Video } from '../types';

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
  const [continueVideos, setContinueVideos] = useState<(Video & { progress: number })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const films = await apiService.getVideos();
        if (films.length > 0) {
          setFeaturedVideo(films[0]); // Sintel
          setTrendingVideos(films.slice(1));
        }

        // Simulating personalized AI recommendation
        const recommended = await apiService.getRecommendedVideos('Sci-Fi');
        setRecommendedVideos(recommended);

        // Fetch continue watching videos from progress mapping
        const listWithProgress: (Video & { progress: number })[] = [];
        for (const [vId, progressObj] of Object.entries(playbackProgress)) {
          const matched = films.find((f) => f.id === vId);
          if (matched) {
            const percentage = (progressObj.position / progressObj.duration) * 100;
            listWithProgress.push({ ...matched, progress: percentage });
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
    // Check access role/tier limits
    if (video.tier === 'PREMIUM' && (!user || user.role === 'GUEST')) {
      alert('This is Premium content! Please log in and upgrade your plan to watch.');
      router.push('/(auth)/login');
      return;
    }
    router.push(`/watch/${video.id}`);
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
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>
        {item.title}
      </ThemedText>
      <View style={styles.cardMeta}>
        <ThemedText type="code" style={styles.cardGenre}>
          {item.year || 2026} • {item.genre}
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
        {/* Progress bar overlay */}
        <View style={styles.continueProgressBg}>
          <View style={[styles.continueProgressFill, { width: `${item.progress}%` }]} />
        </View>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.continueTitle}>
        {item.title}
      </ThemedText>
    </Pressable>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Guest Warning Banner */}
        {!isAuthenticated && (
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.guestBanner}>
            <ShieldAlert size={18} color="#ffffff" />
            <ThemedText type="smallBold" style={styles.guestBannerText}>
              Viewing as Guest. Tap to Sign In and unlock downloads, playlists, & uploads.
            </ThemedText>
          </Pressable>
        )}

        {/* Hero Banner */}
        {featuredVideo && (
          <ImageBackground
            source={{ uri: featuredVideo.thumbnailUrl }}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <View style={styles.heroGradient}>
              <View style={styles.heroDetails}>
                <View style={styles.heroBadgeRow}>
                  <Flame size={14} color="#e50914" fill="#e50914" />
                  <ThemedText type="code" style={styles.heroBadgeText}>
                    #1 TRENDING TODAY
                  </ThemedText>
                </View>

                <ThemedText type="title" style={styles.heroTitle}>
                  {featuredVideo.title}
                </ThemedText>

                <ThemedText type="small" style={styles.heroDesc} numberOfLines={3}>
                  {featuredVideo.description}
                </ThemedText>

                {/* Hero Actions */}
                <View style={styles.heroActions}>
                  <Pressable
                    onPress={() => handleWatch(featuredVideo)}
                    style={[styles.heroPlayButton, { backgroundColor: '#ffffff' }]}
                  >
                    <Play size={18} color="#000000" fill="#000000" />
                    <ThemedText type="smallBold" style={styles.heroPlayText}>
                      Play
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => handleWatch(featuredVideo)}
                    style={[styles.heroInfoButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  >
                    <Info size={18} color="#ffffff" />
                    <ThemedText type="small" style={styles.heroInfoText}>
                      Info
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </ImageBackground>
        )}

        {/* Continue Watching Section */}
        {continueVideos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={16} color="#e50914" />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Continue Watching
              </ThemedText>
            </View>
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

        {/* Trending Section */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Trending Now
          </ThemedText>
          <FlatList
            horizontal
            data={trendingVideos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* AI Recommendations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={16} color="#e1ad01" />
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              AI Recommendations For You
            </ThemedText>
          </View>
          <FlatList
            horizontal
            data={recommendedVideos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBanner: {
    backgroundColor: '#e50914',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestBannerText: {
    color: '#ffffff',
    fontSize: 10,
    flex: 1,
  },
  heroBackground: {
    width: '100%',
    height: 400,
    justifyContent: 'flex-end',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  heroDetails: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    color: '#e50914',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  heroDesc: {
    color: '#dddddd',
    fontSize: 12,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  heroPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 4,
    flex: 1,
  },
  heroPlayText: {
    color: '#000000',
  },
  heroInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 4,
    flex: 1,
  },
  heroInfoText: {
    color: '#ffffff',
  },
  section: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.three,
  },
  horizontalList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  cardPressable: {
    width: 120,
    gap: 4,
  },
  posterContainer: {
    position: 'relative',
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#e1ad01',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  resolutionOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  resolutionOverlayText: {
    color: '#ffffff',
    fontSize: 8,
  },
  cardTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardGenre: {
    color: '#888888',
    fontSize: 9.5,
  },
  continueCard: {
    width: 160,
    gap: 4,
  },
  continueThumbnailContainer: {
    position: 'relative',
    width: 160,
    aspectRatio: 16 / 9,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  continueImage: {
    width: '100%',
    height: '100%',
  },
  continuePlayBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueProgressBg: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  continueTitle: {
    fontSize: 11,
  },
});
