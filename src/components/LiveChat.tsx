import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Pressable, FlatList, Image, useColorScheme, Animated } from 'react-native';
import { Send, Heart, Flame, ThumbsUp, ShieldAlert } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { LiveChatEvent } from '../types';

interface LiveChatProps {
  videoId: string;
}

const INITIAL_MESSAGES: LiveChatEvent[] = [
  { id: '1', username: 'stream_watcher', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', message: 'Lets goooo!! 🎮🔥', timestamp: '12:00' },
  { id: '2', username: 'alicia_k', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', message: 'Wow the stream latency is so low!', timestamp: '12:01' },
  { id: '3', username: 'pro_gamer99', avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80', message: 'Bought my superchat ticket! KES 500 for the setup tour!', timestamp: '12:02', donationAmount: 500 },
  { id: '4', username: 'elizabeth_w', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', message: 'Is this 4K 60FPS?', timestamp: '12:02' },
];

const BOT_MESSAGES = [
  'Insane gameplay! 🔥',
  'Can we get a shoutout?',
  'Sending love from Nairobi! 🇰🇪❤️',
  'Who else is watching from the office? 😂',
  'Here is a superchat donation for the channel! 💰',
  'MOD NOTE: Keep chat friendly!',
];

export default function LiveChat({ videoId }: LiveChatProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const [messages, setMessages] = useState<LiveChatEvent[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Floating reactions state
  const [reactions, setReactions] = useState<{ id: string; type: string; anim: Animated.Value }[]>([]);

  // Simulation of incoming user/bot chat messages
  useEffect(() => {
    const timer = setInterval(() => {
      const isDonation = Math.random() > 0.8;
      const botText = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      const donationAmount = isDonation ? [100, 200, 500, 1000][Math.floor(Math.random() * 4)] : undefined;

      const newMsg: LiveChatEvent = {
        id: `bot-${Date.now()}`,
        username: ['alpha_coder', 'gamer_chick', 'tech_nomad', 'net_critic', 'stream_bot'][Math.floor(Math.random() * 5)],
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
        message: donationAmount ? `Sent Super Chat! 💰 KES ${donationAmount}` : botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        donationAmount,
      };

      setMessages((prev) => [...prev, newMsg].slice(-50)); // Cap at 50 messages
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: LiveChatEvent = {
      id: `user-${Date.now()}`,
      username: 'fred_musinde',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      message: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  // Trigger floating reaction animation
  const triggerReaction = (type: string) => {
    const id = `react-${Date.now()}-${Math.random()}`;
    const anim = new Animated.Value(0);
    
    setReactions((prev) => [...prev, { id, type, anim }]);
    
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Remove reaction once finished
      setReactions((prev) => prev.filter((r) => r.id !== id));
    });
  };

  const renderMessage = ({ item }: { item: LiveChatEvent }) => {
    if (item.donationAmount) {
      // Superchat style card
      return (
        <View style={styles.superChatCard}>
          <View style={styles.superChatHeader}>
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            <View style={styles.usernameCol}>
              <ThemedText type="smallBold" style={styles.superChatUser}>
                {item.username}
              </ThemedText>
              <ThemedText type="code" style={styles.superChatAmount}>
                KES {item.donationAmount}
              </ThemedText>
            </View>
          </View>
          <View style={styles.superChatBody}>
            <ThemedText type="small" style={styles.superChatText}>
              {item.message}
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chatRow}>
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        <View style={styles.messageContent}>
          <ThemedText type="smallBold" style={styles.chatUsername}>
            {item.username}
          </ThemedText>
          <ThemedText type="small" style={styles.chatText}>
            {item.message}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating Reactions Overlay */}
      <View style={styles.reactionsArea} pointerEvents="none">
        {reactions.map((react) => {
          const translateY = react.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [150, -150],
          });
          const opacity = react.anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = react.anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.5, 1.2, 0.8],
          });
          const rotate = react.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['-10deg', '10deg'],
          });

          return (
            <Animated.View
              key={react.id}
              style={[
                styles.floatingReaction,
                {
                  opacity,
                  transform: [{ translateY }, { scale }, { rotate }],
                },
              ]}
            >
              {react.type === 'heart' && <Heart size={24} color="#e50914" fill="#e50914" />}
              {react.type === 'flame' && <Flame size={24} color="#e1ad01" fill="#e1ad01" />}
              {react.type === 'like' && <ThumbsUp size={24} color="#2196f3" fill="#2196f3" />}
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.chatHeader}>
        <ThemedText type="smallBold">Live Chat Feed</ThemedText>
        <View style={styles.moderatorBadge}>
          <ShieldAlert size={14} color="#e50914" />
          <ThemedText type="code" style={styles.badgeText}>AutoModerated</ThemedText>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.chatList}
      />

      {/* Input panel */}
      <View style={[styles.inputRow, { borderTopColor: colors.backgroundElement }]}>
        <TextInput
          placeholder="Send a chat..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          style={[styles.inputField, { color: colors.text, backgroundColor: colors.backgroundElement }]}
        />
        <Pressable onPress={handleSend} style={styles.sendButton}>
          <Send size={18} color="#ffffff" />
        </Pressable>
      </View>

      {/* Quick Reactions bar */}
      <View style={styles.quickReactionsRow}>
        <Pressable onPress={() => triggerReaction('heart')} style={styles.reactionButton}>
          <Heart size={20} color="#e50914" fill="#e50914" />
        </Pressable>
        <Pressable onPress={() => triggerReaction('flame')} style={styles.reactionButton}>
          <Flame size={20} color="#e1ad01" fill="#e1ad01" />
        </Pressable>
        <Pressable onPress={() => triggerReaction('like')} style={styles.reactionButton}>
          <ThumbsUp size={20} color="#2196f3" fill="#2196f3" />
        </Pressable>
        <Pressable 
          onPress={() => {
            setInputText('KES 200 Superchat donation incoming!');
            // Pre-fill superchat message
            triggerReaction('like');
          }}
          style={styles.donateActionBtn}
        >
          <ThemedText type="code" style={styles.donateActionText}>KES +💰</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  reactionsArea: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 60,
    height: 300,
    zIndex: 10,
    alignItems: 'center',
  },
  floatingReaction: {
    position: 'absolute',
    bottom: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  moderatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#e50914',
    fontSize: 9,
  },
  chatList: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.two,
    gap: Spacing.two,
  },
  chatRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
  },
  messageContent: {
    flex: 1,
  },
  chatUsername: {
    color: '#888888',
    fontSize: 11,
  },
  chatText: {
    color: '#dddddd',
    marginTop: 2,
  },
  superChatCard: {
    backgroundColor: '#e1ad01',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  superChatHeader: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#c69800',
    alignItems: 'center',
    gap: 8,
  },
  usernameCol: {
    flex: 1,
  },
  superChatUser: {
    color: '#000000',
  },
  superChatAmount: {
    color: '#000000',
    fontWeight: 'bold',
  },
  superChatBody: {
    padding: 8,
  },
  superChatText: {
    color: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  inputField: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.two,
    gap: 8,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donateActionBtn: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 16,
  },
  donateActionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
