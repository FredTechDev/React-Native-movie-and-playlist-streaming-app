import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Dimensions, useColorScheme } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { 
  Play, Pause, RotateCcw, RotateCw, Settings, Subtitles, 
  Maximize, Minimize, Tv, Volume2, VolumeX, Eye 
} from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { usePlayerStore } from '../store/usePlayerStore';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
  isOffline?: boolean;
  offlineUri?: string;
}

export default function VideoPlayer({ video, isOffline = false, offlineUri }: VideoPlayerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const subtitlesEnabled = usePlayerStore((s) => s.subtitlesEnabled);
  const isCasting = usePlayerStore((s) => s.isCasting);
  const setPlaybackSpeed = usePlayerStore((s) => s.setPlaybackSpeed);
  const toggleSubtitles = usePlayerStore((s) => s.toggleSubtitles);
  const setCastDevice = usePlayerStore((s) => s.setCastDevice);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const playbackProgress = usePlayerStore((s) => s.playbackProgress);

  const [showControls, setShowControls] = useState(true);
  const [currentResolution, setCurrentResolution] = useState(video.resolution || '1080p');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [muted, setMuted] = useState(false);

  // Determine streaming source
  const sourceUri = isOffline && offlineUri ? offlineUri : video.videoUrl;

  // Setup expo-video player
  const player = useVideoPlayer(sourceUri, (p) => {
    p.loop = false;
    p.muted = muted;
    p.playbackRate = playbackSpeed;
    
    // Resume progress if exists
    const progress = playbackProgress[video.id];
    if (progress) {
      p.currentTime = progress.position;
    }
    p.play();
  });

  // Track playback status updates
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 1);
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (!player) return;
      const ct = player.currentTime;
      const dur = player.duration || video.duration || 1;
      const playing = player.playing;
      
      setCurrentTime(ct);
      setDuration(dur);
      
      if (playing !== isPlayingRef.current) {
        setIsPlaying(playing);
        isPlayingRef.current = playing;
      }
      
      // Only update store when actively playing and position changed
      if (playing && ct > 0 && dur > 0) {
        updateProgress(video.id, ct, dur);
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [player, video.id, video.duration, updateProgress]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Jump forwards/backwards 10s
  const skipSeconds = (seconds: number) => {
    player.currentTime = Math.max(0, Math.min(duration, player.currentTime + seconds));
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle Cast trigger
  const handleCastToggle = () => {
    if (isCasting) {
      setCastDevice(null);
    } else {
      setCastDevice('Living Room Samsung TV');
    }
  };

  return (
    <View style={styles.container}>
      {isCasting ? (
        <View style={styles.castingOverlay}>
          <Tv size={64} color="#e50914" />
          <ThemedText type="smallBold" style={styles.castingText}>
            Casting to Living Room Samsung TV...
          </ThemedText>
          <Pressable style={styles.disconnectButton} onPress={handleCastToggle}>
            <ThemedText type="small">Disconnect Cast</ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setShowControls(!showControls)} style={styles.videoPressable}>
          <VideoView
            player={player}
            style={styles.video}
            allowsPictureInPicture={true}
          />

          {/* Controls Overlay */}
          {showControls && (
            <View style={styles.controlsContainer}>
              {/* Header */}
              <View style={styles.header}>
                <ThemedText type="smallBold" style={styles.videoTitle} numberOfLines={1}>
                  {video.title}
                </ThemedText>
                
                {/* badges */}
                <View style={styles.badgeRow}>
                  <View style={styles.resolutionBadge}>
                    <ThemedText type="code" style={styles.badgeText}>
                      {currentResolution}
                    </ThemedText>
                  </View>
                  {video.resolution.includes('HDR') && (
                    <View style={styles.hdrBadge}>
                      <ThemedText type="code" style={styles.badgeText}>HDR</ThemedText>
                    </View>
                  )}
                  {isOffline && (
                    <View style={styles.offlineBadge}>
                      <ThemedText type="code" style={styles.badgeText}>OFFLINE</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Center Controls (Skip / Play / Pause) */}
              <View style={styles.centerRow}>
                <Pressable onPress={() => skipSeconds(-10)} style={styles.iconButton}>
                  <RotateCcw size={32} color="#ffffff" />
                </Pressable>

                <Pressable onPress={handlePlayPause} style={styles.playButton}>
                  {isPlaying ? (
                    <Pause size={36} color="#000000" fill="#000000" />
                  ) : (
                    <Play size={36} color="#000000" fill="#000000" />
                  )}
                </Pressable>

                <Pressable onPress={() => skipSeconds(10)} style={styles.iconButton}>
                  <RotateCw size={32} color="#ffffff" />
                </Pressable>
              </View>

              {/* Footer Panel */}
              <View style={styles.footer}>
                {/* Subtitle text display if enabled */}
                {subtitlesEnabled && (
                  <View style={styles.subtitleOverlay}>
                    <ThemedText type="small" style={styles.subtitleText}>
                      [Mock Subtitle in English]
                    </ThemedText>
                  </View>
                )}

                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <ThemedText type="code" style={styles.timeText}>
                    {formatTime(currentTime)}
                  </ThemedText>
                  
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${(currentTime / duration) * 100}%` }
                      ]} 
                    />
                  </View>

                  <ThemedText type="code" style={styles.timeText}>
                    {formatTime(duration)}
                  </ThemedText>
                </View>

                {/* Settings toolbar */}
                <View style={styles.toolbar}>
                  {/* Left items */}
                  <View style={styles.toolbarLeft}>
                    <Pressable onPress={() => {
                      const newMute = !muted;
                      setMuted(newMute);
                      player.muted = newMute;
                    }} style={styles.toolIcon}>
                      {muted ? <VolumeX size={20} color="#ffffff" /> : <Volume2 size={20} color="#ffffff" />}
                    </Pressable>

                    <Pressable onPress={handleCastToggle} style={styles.toolIcon}>
                      <Tv size={20} color={isCasting ? '#e50914' : '#ffffff'} />
                    </Pressable>

                    <Pressable onPress={() => toggleSubtitles(!subtitlesEnabled)} style={styles.toolIcon}>
                      <Subtitles size={20} color={subtitlesEnabled ? '#e50914' : '#ffffff'} />
                    </Pressable>
                  </View>

                  {/* Right items */}
                  <View style={styles.toolbarRight}>
                    {/* Speed Menu Trigger */}
                    <Pressable onPress={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowQualityMenu(false);
                    }} style={styles.toolTextButton}>
                      <ThemedText type="small" style={styles.toolText}>
                        {playbackSpeed}x
                      </ThemedText>
                    </Pressable>

                    {/* Quality Menu Trigger */}
                    <Pressable onPress={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSpeedMenu(false);
                    }} style={styles.toolTextButton}>
                      <Settings size={18} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      )}

      {/* Floating Speed Menu Overlay */}
      {showSpeedMenu && (
        <ThemedView type="backgroundElement" style={styles.menuOverlay}>
          <ThemedText type="smallBold" style={styles.menuTitle}>Playback Speed</ThemedText>
          {[0.5, 1.0, 1.5, 2.0].map((rate) => (
            <Pressable 
              key={rate} 
              onPress={() => {
                setPlaybackSpeed(rate);
                player.playbackRate = rate;
                setShowSpeedMenu(false);
              }}
              style={styles.menuItem}>
              <ThemedText type="small" style={{ color: playbackSpeed === rate ? '#e50914' : '#ffffff' }}>
                {rate}x {rate === 1.0 ? '(Normal)' : ''}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      )}

      {/* Floating Quality Menu Overlay */}
      {showQualityMenu && (
        <ThemedView type="backgroundElement" style={styles.menuOverlay}>
          <ThemedText type="smallBold" style={styles.menuTitle}>Stream Quality</ThemedText>
          {['4K', '1080p', '720p', '480p'].map((res) => (
            <Pressable 
              key={res} 
              onPress={() => {
                setCurrentResolution(res);
                setShowQualityMenu(false);
              }}
              style={styles.menuItem}>
              <ThemedText type="small" style={{ color: currentResolution === res ? '#e50914' : '#ffffff' }}>
                {res}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  videoPressable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  castingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: Spacing.four,
  },
  castingText: {
    marginTop: Spacing.two,
    textAlign: 'center',
    color: '#ffffff',
  },
  disconnectButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#222222',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    color: '#ffffff',
    flex: 1,
    marginRight: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  resolutionBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e50914',
  },
  hdrBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e1ad01',
  },
  offlineBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.five,
  },
  iconButton: {
    padding: Spacing.two,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: Spacing.two,
  },
  subtitleOverlay: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: Spacing.one,
  },
  subtitleText: {
    color: '#ffff00',
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  toolIcon: {
    padding: 4,
  },
  toolTextButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toolText: {
    color: '#ffffff',
  },
  menuOverlay: {
    position: 'absolute',
    bottom: Spacing.three,
    right: Spacing.three,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    width: 150,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuTitle: {
    fontSize: 11,
    marginBottom: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
  },
  menuItem: {
    paddingVertical: 6,
  },
});
