import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, FlatList, ActivityIndicator, useColorScheme, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Mic, SlidersHorizontal, Play, Sparkles, X, MicOff, Film } from 'lucide-react-native';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors, Spacing, BottomTabInset } from '../constants/theme';
import { apiService } from '../services/api';
import { Video } from '../types';

export default function ExploreScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<'short' | 'medium' | 'long' | undefined>(undefined);
  
  // Voice Search State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voicePulse, setVoicePulse] = useState(true);

  // Search trigger
  const handleSearch = async (text: string, genreFilter?: string, durationFilter?: typeof selectedDuration) => {
    setLoading(true);
    try {
      const filtered = await apiService.searchVideos(text, {
        genre: genreFilter,
        duration: durationFilter
      });
      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(query, selectedGenre, selectedDuration);
  }, [query, selectedGenre, selectedDuration]);

  // Voice Search simulate
  const triggerVoiceListening = () => {
    setShowVoiceModal(true);
    setVoicePulse(true);
    
    // Simulate speech-to-text conversion after 2.5s
    setTimeout(() => {
      setQuery('Sintel');
      setShowVoiceModal(false);
    }, 2500);
  };

  const clearFilters = () => {
    setSelectedGenre(undefined);
    setSelectedDuration(undefined);
    setShowFilters(false);
  };

  const renderResultCard = ({ item }: { item: Video }) => (
    <Pressable 
      onPress={() => router.push(`/watch/${item.id}`)} 
      style={[styles.resultRow, { borderBottomColor: colors.backgroundElement }]}
    >
      <View style={styles.thumbnailContainer}>
        <Film size={24} color={colors.textSecondary} style={styles.thumbnailPlaceholder} />
        <View style={styles.playBadge}>
          <Play size={12} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
      <View style={styles.resultDetails}>
        <ThemedText type="smallBold" numberOfLines={1}>{item.title}</ThemedText>
        <ThemedText type="code" style={{ color: colors.textSecondary }}>
          {item.genre} • {item.resolution} • {item.isLive ? 'LIVE' : `${Math.floor(item.duration / 60)}m`}
        </ThemedText>
        <ThemedText type="code" style={{ color: '#e50914' }}>{item.tier}</ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <View style={[styles.searchFieldWrapper, { backgroundColor: colors.backgroundElement }]}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search movies, TV shows, genres..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            style={[styles.inputField, { color: colors.text }]}
          />
          <Pressable onPress={triggerVoiceListening} style={styles.micBtn}>
            <Mic size={18} color="#e50914" />
          </Pressable>
        </View>

        <Pressable onPress={() => setShowFilters(!showFilters)} style={[styles.filterTrigger, { backgroundColor: colors.backgroundElement }]}>
          <SlidersHorizontal size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Genre tags bar */}
      <View style={styles.genreTagsBar}>
        {['All', 'Fantasy', 'Sci-Fi', 'Animation', 'Motorsports', 'Gaming'].map((genre) => {
          const isSelected = (genre === 'All' && !selectedGenre) || selectedGenre === genre;
          return (
            <Pressable
              key={genre}
              onPress={() => {
                setSelectedGenre(genre === 'All' ? undefined : genre);
              }}
              style={[
                styles.genreTag,
                isSelected && styles.genreTagActive,
                { backgroundColor: colors.backgroundElement }
              ]}
            >
              <ThemedText type="code" style={{ color: isSelected ? '#ffffff' : colors.textSecondary }}>
                {genre}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <ThemedView type="backgroundElement" style={styles.filtersPanel}>
          <View style={styles.filterHeader}>
            <ThemedText type="smallBold">Advanced Search Filters</ThemedText>
            <Pressable onPress={clearFilters} style={styles.clearBtn}>
              <ThemedText type="code" style={{ color: '#f44336' }}>Reset Filters</ThemedText>
            </Pressable>
          </View>

          {/* Duration Filters */}
          <View style={styles.filterSection}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>Video Duration</ThemedText>
            <View style={styles.optionRow}>
              {[
                { label: 'Short (< 5m)', value: 'short' },
                { label: 'Medium (5-15m)', value: 'medium' },
                { label: 'Long (> 15m)', value: 'long' }
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelectedDuration(opt.value as any)}
                  style={[
                    styles.optionBtn,
                    selectedDuration === opt.value && styles.optionBtnActive,
                    { backgroundColor: colors.backgroundSelected }
                  ]}
                >
                  <ThemedText type="code" style={{ color: selectedDuration === opt.value ? '#ffffff' : colors.textSecondary }}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </ThemedView>
      )}

      {/* AI Recommendation hint */}
      {query.length > 2 && (
        <View style={styles.aiHintBox}>
          <Sparkles size={14} color="#e1ad01" />
          <ThemedText type="code" style={{ color: '#e1ad01' }}>
            AI Search parsing matches for theme & keywords.
          </ThemedText>
        </View>
      )}

      {/* Results grid */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultCard}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText type="smallBold" style={{ color: colors.textSecondary }}>
                No video titles found
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Check typing or select another genre category.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Voice Search Listening Modal */}
      <Modal
        visible={showVoiceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.voiceModalBg}>
          <ThemedView type="backgroundElement" style={styles.voiceModalCard}>
            <Mic size={48} color="#e50914" />
            <ThemedText type="title">Listening...</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Speak now to search video channels, genres, and titles.
            </ThemedText>
            <Pressable onPress={() => setShowVoiceModal(false)} style={styles.voiceCancelBtn}>
              <MicOff size={18} color="#ffffff" />
              <ThemedText type="small" style={{ color: '#ffffff' }}>Cancel</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  searchBox: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  searchFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
  },
  searchIcon: {
    marginRight: 6,
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  micBtn: {
    padding: 8,
  },
  filterTrigger: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreTagsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  genreTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreTagActive: {
    backgroundColor: '#e50914',
  },
  filtersPanel: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    padding: 4,
  },
  filterSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888888',
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  optionBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 4,
  },
  optionBtnActive: {
    backgroundColor: '#e50914',
  },
  aiHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 173, 1, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: Spacing.two,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  resultRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  thumbnailContainer: {
    width: 90,
    aspectRatio: 16 / 9,
    backgroundColor: '#222',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailPlaceholder: {
    opacity: 0.5,
  },
  playBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  voiceModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  voiceModalCard: {
    padding: Spacing.five,
    borderRadius: 8,
    alignItems: 'center',
    gap: Spacing.three,
  },
  voiceCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e50914',
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    marginTop: Spacing.two,
  },
});
