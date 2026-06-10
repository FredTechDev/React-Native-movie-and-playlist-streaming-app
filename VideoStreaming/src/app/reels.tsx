import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { BottomTabInset } from '../constants/theme';
import { apiService } from '../services/api';
import ReelCard from '../components/ReelCard';
import { Video } from '../types';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const REEL_HEIGHT = WINDOW_HEIGHT - 80;

export default function ReelsScreen() {
  const isScreenFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      try {
        const shortVideos = await apiService.getReels();
        setReels(shortVideos);
      } catch (err) {
        console.error('Error fetching reels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80 // play when 80% visible
  }).current;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={reels}
        renderItem={({ item, index }) => (
          <ReelCard 
            video={item} 
            isActive={isScreenFocused && index === activeIndex} 
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={REEL_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
