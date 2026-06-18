import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '../components/themed-view';
import { apiService } from '../services/api';
import ReelCard from '../components/ReelCard';
import { Video } from '../types';

export default function ReelsScreen() {
  // useFocusEffect from expo-router works correctly on both native and web
  // (unlike @react-navigation/native's useIsFocused which requires NavigationContainer)
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      // Pause all reels when leaving the screen
      return () => {
        setIsScreenFocused(false);
        setActiveIndex(0);
      };
    }, [])
  );

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

  // Stable ref callbacks (must not be re-created to avoid FlatList warning)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0) setContainerHeight(h);
      }}
    >
      {containerHeight > 0 && (
        <FlatList
          data={reels}
          renderItem={({ item, index }) => (
            <ReelCard
              video={item}
              isActive={isScreenFocused && index === activeIndex}
              height={containerHeight}
            />
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={containerHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
        />
      )}
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
