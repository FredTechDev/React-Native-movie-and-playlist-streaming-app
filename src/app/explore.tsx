import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Mic,
  SlidersHorizontal,
  Play,
  X,
  Clock,
  TrendingUp,
  Film,
  Radio,
  Flame,
} from 'lucide-react-native';


import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { apiService } from '../services/api';
import { Video } from '../types';

// ── Genre chips that match actual mock data genres ──────────────────────────
const GENRE_TAGS = [
  'All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Adventure',
  'Animation', 'Fantasy', 'Crime', 'Music', 'Gaming', 'Travel',
];

const DURATION_OPTIONS = [
  { label: 'Short  < 5m', value: 'short' as const },
  { label: 'Medium 5–15m', value: 'medium' as const },
  { label: 'Long  > 15m', value: 'long' as const },
];

// Recent searches shown before the user types
const RECENT_SEARCHES = [
  'Christopher Nolan', 'Interstellar', 'Dune', 'The Dark Knight', 'Sci-Fi 4K',
];

const TRENDING_SEARCHES = [
  { term: 'Inception', count: '4.5M' },
  { term: 'Dune Part Two', count: '3.1M' },
  { term: 'Spider-Man', count: '2.8M' },
  { term: 'Christopher Nolan', count: '1.9M' },
  { term: 'Avatar 4K', count: '1.4M' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<'short' | 'medium' | 'long' | undefined>(undefined);

  // Browse-all initial catalog
  const [browseCatalog, setBrowseCatalog] = useState<Video[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Animated underline for search bar
  const focusAnim = useRef(new Animated.Value(0)).current;

  // ── Load full catalog on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setCatalogLoading(true);
      try {
        const videos = await apiService.getVideos();
        setBrowseCatalog(videos);
      } finally {
        setCatalogLoading(false);
      }
    };
    load();
  }, []);

  // ── Debounce the raw query by 350 ms ───────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Run search whenever debounced query or filters change ───────────────
  useEffect(() => {
    if (!debouncedQuery.trim() && !selectedGenre && !selectedDuration) {
      setHasSearched(false);
      setResults([]);
      return;
    }
    const run = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const filtered = await apiService.searchVideos(debouncedQuery, {
          genre: selectedGenre,
          duration: selectedDuration,
        });
        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery, selectedGenre, selectedDuration]);

  const handleFocus = () =>
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const handleBlur = () =>
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre(undefined);
    setSelectedDuration(undefined);
    setHasSearched(false);
    setResults([]);
  };

  const applyRecentSearch = (term: string) => {
    setQuery(term);
  };

  const underlineColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.backgroundElement, '#e50914'],
  });

  // Memoize filtered catalog to avoid re-filter on every render
  const filteredCatalog = useMemo(
    () => selectedGenre
      ? browseCatalog.filter((v) => v.genre === selectedGenre)
      : browseCatalog,
    [browseCatalog, selectedGenre]
  );

  // ── Search result row ────────────────────────────────────────────────────
  const renderResultCard = useCallback(
    ({ item }: { item: Video }) => (
      <Pressable
        onPress={() =>
          router.push({ pathname: '/watch/[id]', params: { id: item.id } } as any)
        }
        style={[styles.resultRow, { borderBottomColor: colors.backgroundElement }]}
      >
        {/* Poster */}
        <View style={styles.posterWrap}>
          <Image
            source={{ uri: item.posterUrl || item.thumbnailUrl }}
            style={styles.posterThumb}
          />
          {item.isLive && (
            <View style={styles.livePill}>
              <Radio size={8} color="#fff" />
              <ThemedText type="code" style={styles.livePillText}>LIVE</ThemedText>
            </View>
          )}
          <View style={styles.playPill}>
            <Play size={9} color="#fff" fill="#fff" />
          </View>
        </View>

        {/* Details */}
        <View style={styles.resultMeta}>
          <ThemedText type="smallBold" numberOfLines={2} style={styles.resultTitle}>
            {item.title}
          </ThemedText>

          <ThemedText type="code" style={[styles.metaLine, { color: colors.textSecondary }]}>
            {item.genre}
            {item.year ? ` · ${item.year}` : ''}
            {' · '}
            {item.resolution}
          </ThemedText>

          {item.director ? (
            <ThemedText type="code" style={[styles.metaLine, { color: colors.textSecondary }]} numberOfLines={1}>
              Dir. {item.director}
            </ThemedText>
          ) : null}

          {item.cast && item.cast.length > 0 ? (
            <ThemedText type="code" style={[styles.metaLine, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.cast.slice(0, 3).join(' · ')}
            </ThemedText>
          ) : null}

          <View style={styles.tierRow}>
            <View
              style={[
                styles.tierPill,
                { backgroundColor: item.tier === 'PREMIUM' ? '#e1ad01' : item.tier === 'BASIC' ? '#1565c0' : '#333' },
              ]}
            >
              <ThemedText type="code" style={styles.tierPillText}>
                {item.tier}
              </ThemedText>
            </View>
            {!item.isLive && (
              <ThemedText type="code" style={[styles.metaLine, { color: colors.textSecondary, marginLeft: 8 }]}>
                {item.duration >= 3600
                  ? `${Math.floor(item.duration / 3600)}h ${Math.floor((item.duration % 3600) / 60)}m`
                  : `${Math.floor(item.duration / 60)}m`}
              </ThemedText>
            )}
          </View>
        </View>
      </Pressable>
    ),
    [colors, router]
  );

  const renderBrowseCard = useCallback(
    ({ item }: { item: Video }) => (
      <Pressable
        onPress={() =>
          router.push({ pathname: '/watch/[id]', params: { id: item.id } } as any)
        }
        style={styles.browseCard}
      >
        <View style={styles.browsePosterWrap}>
          <Image
            source={{ uri: item.posterUrl || item.thumbnailUrl }}
            style={styles.browsePoster}
          />
          <View style={styles.cardGradientOverlay} />
          {item.tier === 'PREMIUM' && (
            <View style={styles.premiumBadgeSmall}>
              <ThemedText type="code" style={styles.premiumBadgeTextSmall}>EXCLUSIVE</ThemedText>
            </View>
          )}
          <View style={styles.browsePlayOverlay}>
            <Play size={10} color="#fff" fill="#fff" />
          </View>
        </View>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.browseTitle}>
          {item.title}
        </ThemedText>
        <ThemedText type="caption" style={[styles.browseGenre, { color: colors.textSecondary }]}>
          {item.year ? `${item.year} · ` : ''}{item.genre}
        </ThemedText>
      </Pressable>
    ),
    [colors, router]
  );

  // ── Genre tag row ────────────────────────────────────────────────────────
  const genreTagRow = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.genreTagList}
      style={styles.genreTagScroll}
    >
      {GENRE_TAGS.map((genre) => {
        const active = (genre === 'All' && !selectedGenre) || selectedGenre === genre;
        return (
          <Pressable
            key={genre}
            onPress={() => setSelectedGenre(genre === 'All' ? undefined : genre)}
            style={[
              styles.genreChip,
              active ? styles.genreChipActive : { backgroundColor: colors.backgroundElement },
            ]}
          >
            <ThemedText
              type="code"
              style={[styles.genreChipText, { color: active ? '#ffffff' : colors.textSecondary }]}
            >
              {genre}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Animated.View
          style={[
            styles.searchFieldWrap,
            { backgroundColor: colors.backgroundElement, borderBottomColor: underlineColor, borderBottomWidth: 2 },
          ]}
        >
          <Search size={17} color={colors.textSecondary} />
          <TextInput
            placeholder="Movies, directors, cast, genres…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[styles.inputField, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable onPress={clearSearch} hitSlop={12}>
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                // Simulated voice: fill a random recent search
                const pick = RECENT_SEARCHES[Math.floor(Math.random() * RECENT_SEARCHES.length)];
                setQuery(pick);
              }}
              hitSlop={12}
            >
              <Mic size={17} color="#e50914" />
            </Pressable>
          )}
        </Animated.View>

        {/* Filter toggle */}
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={[
            styles.filterBtn,
            { backgroundColor: showFilters ? '#e50914' : colors.backgroundElement },
          ]}
        >
          <SlidersHorizontal size={18} color={showFilters ? '#fff' : colors.text} />
        </Pressable>
      </View>

      {/* ── Genre chips ────────────────────────────────────────────────── */}
      {genreTagRow}

      {/* ── Duration filter panel ──────────────────────────────────────── */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.backgroundElement }]}>
          <ThemedText type="smallBold" style={styles.filterLabel}>Duration</ThemedText>
          <View style={styles.filterOptionRow}>
            {DURATION_OPTIONS.map((opt) => {
              const active = selectedDuration === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelectedDuration(active ? undefined : opt.value)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: '#e50914' }
                      : { backgroundColor: colors.backgroundSelected },
                  ]}
                >
                  <ThemedText
                    type="code"
                    style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 10.5 }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => { setSelectedDuration(undefined); setShowFilters(false); }}
            style={styles.resetLink}
          >
            <ThemedText type="code" style={{ color: '#e50914', fontSize: 11 }}>Reset filters</ThemedText>
          </Pressable>
        </View>
      )}

      {/* ── Loading spinner ─────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#e50914" size="large" />
        </View>
      )}

      {/* ── Search results list ─────────────────────────────────────────── */}
      {!loading && hasSearched && (
        <FlatList
          data={results}
          renderItem={renderResultCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + 16 },
          ]}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          initialNumToRender={8}
          ListHeaderComponent={
            <ThemedText type="code" style={[styles.resultCount, { color: colors.textSecondary }]}>
              {results.length === 0 ? 'No results' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </ThemedText>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Film size={52} color={colors.textSecondary} style={{ opacity: 0.35 }} />
              <ThemedText type="smallBold" style={{ color: colors.textSecondary, marginTop: 12 }}>
                No titles found
              </ThemedText>
              <ThemedText type="code" style={[styles.emptyHint, { color: colors.textSecondary }]}>
                Try a different keyword, director, actor, or genre.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* ── Recent & Trending searches (shown when query is empty) ──────── */}
      {!hasSearched && !loading && query.length === 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Clock size={14} color={colors.textSecondary} />
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Recent Searches
            </ThemedText>
          </View>
          {RECENT_SEARCHES.map((term) => (
            <Pressable
              key={term}
              onPress={() => applyRecentSearch(term)}
              style={[styles.recentRow, { borderBottomColor: colors.backgroundElement }]}
            >
              <Search size={13} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText type="small" style={{ color: colors.text, marginLeft: 8, flex: 1 }}>
                {term}
              </ThemedText>
              <TrendingUp size={11} color={colors.textSecondary} style={{ opacity: 0.4 }} />
            </Pressable>
          ))}

          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Flame size={14} color="#e50914" fill="#e50914" />
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.text }]}>
              Trending Searches
            </ThemedText>
          </View>
          {TRENDING_SEARCHES.map(({ term, count }, i) => (
            <Pressable
              key={term}
              onPress={() => applyRecentSearch(term)}
              style={[styles.recentRow, { borderBottomColor: colors.backgroundElement }]}
            >
              <ThemedText type="smallBold" style={{ color: '#e50914', fontSize: 13, width: 20 }}>
                {i + 1}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.text, flex: 1 }}>
                {term}
              </ThemedText>
              <ThemedText type="code" style={{ color: colors.textSecondary, fontSize: 10 }}>
                {count} searches
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Browse-all catalog grid (default when no query) ─────────────── */}
      {!hasSearched && (
        <>
          <View style={[styles.sectionHeader, { paddingHorizontal: Spacing.three, marginTop: 4 }]}>
            <TrendingUp size={14} color="#e50914" />
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.text }]}>
              {selectedGenre ? selectedGenre : 'All Titles'}
            </ThemedText>
          </View>

          {catalogLoading ? (
            <ActivityIndicator color="#e50914" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filteredCatalog}
              renderItem={renderBrowseCard}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={styles.browseRow}
              contentContainerStyle={[styles.browseGrid, { paddingBottom: BottomTabInset + 16 }]}
              windowSize={3}
              maxToRenderPerBatch={6}
              removeClippedSubviews={true}
              initialNumToRender={6}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Search bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchFieldWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Genre chips
  genreTagScroll: {
    flexGrow: 0,
  },
  genreTagList: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
    flexDirection: 'row',
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
  },
  genreChipActive: {
    backgroundColor: '#e50914',
  },
  genreChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // ── Filter panel
  filterPanel: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: 10,
    gap: Spacing.two,
  },
  filterLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  filterOptionRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resetLink: {
    alignSelf: 'flex-end',
  },

  // ── Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Result count
  resultCount: {
    fontSize: 11,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    paddingTop: 4,
  },

  // ── Result rows
  listContent: {
    paddingTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  posterWrap: {
    position: 'relative',
    width: 76,
    aspectRatio: 2 / 3,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  posterThumb: {
    width: '100%',
    height: '100%',
  },
  livePill: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#e50914',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  livePillText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  playPill: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultMeta: {
    flex: 1,
    gap: 3,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  resultTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  metaLine: {
    fontSize: 11,
    lineHeight: 14,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 6,
  },
  emptyHint: {
    fontSize: 11,
    textAlign: 'center',
    marginHorizontal: 32,
    marginTop: 4,
    lineHeight: 16,
  },

  // ── Recent searches
  recentSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // ── Browse grid
  browseGrid: {
    paddingHorizontal: Spacing.two,
    paddingTop: 4,
  },
  browseRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  browseCard: {
    flex: 1,
    maxWidth: '31%',
    gap: 4,
  },
  browsePosterWrap: {
    position: 'relative',
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  cardGradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  browsePoster: {
    width: '100%',
    height: '100%',
  },
  premiumBadgeSmall: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#e1ad01',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  premiumBadgeTextSmall: {
    color: '#000',
    fontSize: 6,
    fontWeight: 'bold',
  },
  browsePlayOverlay: {
    position: 'absolute', bottom: 6, left: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(229,9,20,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  browseTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  browseGenre: {
    fontSize: 9,
  },
});
