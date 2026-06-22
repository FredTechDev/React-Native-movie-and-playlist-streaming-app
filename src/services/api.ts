import { Video, Comment, CreatorAnalytics } from '../types';
import { MOCK_VIDEOS } from '../constants/mockData';

// ─── Simulated notification store ─────────────────────────────────────────────
let notificationBadge = 3;

// ─── In-memory watchlist ────────────────────────────────────────────────────
const watchlist = new Set<string>();

// ─── Trending overrides (hot rank simulation) ─────────────────────────────────
const TRENDING_RANK: Record<string, number> = {
  f3: 1, f2: 2, f7: 3, f1: 4, f6: 5,
};

// Simulated API service layer. Ready for integration with NestJS/PostgreSQL backend.
export const apiService = {
  getVideos: async (tier?: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const list = MOCK_VIDEOS.filter((v) => !v.isReel && !v.isLive);
    const sorted = [...list].sort((a, b) => {
      const ra = TRENDING_RANK[a.id] ?? 99;
      const rb = TRENDING_RANK[b.id] ?? 99;
      return ra - rb;
    });
    if (tier) return sorted.filter((v) => v.tier === tier);
    return sorted;
  },

  getReels: async (): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_VIDEOS.filter((v) => v.isReel);
  },

  getLiveStreams: async (): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return MOCK_VIDEOS.filter((v) => v.isLive);
  },

  getVideoById: async (id: string): Promise<Video | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return MOCK_VIDEOS.find((v) => v.id === id);
  },

  getRecommendedVideos: async (userInterestGenre = 'Fantasy'): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const films = MOCK_VIDEOS.filter((v) => !v.isReel && !v.isLive);
    return [...films].sort((a, b) => {
      const aMatch = a.genre.toLowerCase() === userInterestGenre.toLowerCase() ? 1 : 0;
      const bMatch = b.genre.toLowerCase() === userInterestGenre.toLowerCase() ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return b.views - a.views;
    });
  },

  searchVideos: async (
    query: string,
    filters?: { genre?: string; rating?: string; duration?: 'short' | 'medium' | 'long' },
  ): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    let results = MOCK_VIDEOS.filter((v) => !v.isReel);

    if (query.trim()) {
      const lower = query.toLowerCase();
      results = results.filter(
        (v) =>
          v.title.toLowerCase().includes(lower) ||
          v.description.toLowerCase().includes(lower) ||
          v.genre.toLowerCase().includes(lower) ||
          v.creatorName.toLowerCase().includes(lower) ||
          (v.director && v.director.toLowerCase().includes(lower)) ||
          (v.cast && v.cast.some((actor) => actor.toLowerCase().includes(lower))) ||
          (v.year && String(v.year).includes(lower)) ||
          (v.rating && v.rating.toLowerCase().includes(lower)),
      );
    }

    if (filters?.genre) {
      results = results.filter((v) => v.genre.toLowerCase() === filters.genre?.toLowerCase());
    }

    if (filters?.duration) {
      results = results.filter((v) => {
        if (v.isLive) return true;
        if (filters.duration === 'short') return v.duration < 300;
        if (filters.duration === 'medium') return v.duration >= 300 && v.duration <= 900;
        return v.duration > 900;
      });
    }

    // Sort by relevance: exact title match first, then by views
    return results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return b.views - a.views;
    });
  },

  // Comments
  getCommentsByVideoId: async (videoId: string): Promise<Comment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return [
      {
        id: 'c1',
        videoId,
        userId: 'u2',
        username: 'tech_guru',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        content: 'The production quality here is absolutely stunning! What dynamic range was this filmed at?',
        likes: 124,
        createdAt: '2026-06-08T14:32:00Z',
        isPinned: true,
        replies: [
          {
            id: 'r1',
            commentId: 'c1',
            userId: 'c-blender',
            username: 'Blender Foundation',
            avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
            content: 'Thank you! Rendered using path-tracing cycles at 4K with 2048 samples per pixel.',
            likes: 48,
            createdAt: '2026-06-08T15:00:00Z',
          },
        ],
      },
      {
        id: 'c2',
        videoId,
        userId: 'u3',
        username: 'movie_buff_254',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        content: 'Loved every minute of this. The cinematography rivals Hollywood blockbusters. 🔥',
        likes: 87,
        createdAt: '2026-06-09T10:15:00Z',
      },
      {
        id: 'c3',
        videoId,
        userId: 'u4',
        username: 'nairobi_cinephile',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
        content: 'Would love to see a sequel or a director\'s cut. This world-building is incredible.',
        likes: 52,
        createdAt: '2026-06-10T08:40:00Z',
      },
      {
        id: 'c4',
        videoId,
        userId: 'u5',
        username: 'streamjunkie_ke',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        content: 'Finally something worth watching on a streaming platform. 10/10.',
        likes: 38,
        createdAt: '2026-06-11T19:22:00Z',
      },
    ];
  },

  addComment: async (videoId: string, userId: string, username: string, avatarUrl: string, content: string): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      id: `c-new-${Date.now()}`,
      videoId,
      userId,
      username,
      avatarUrl,
      content,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
  },

  // Creator Dashboard Analytics
  getCreatorAnalytics: async (creatorId: string): Promise<CreatorAnalytics> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      subscribersCount: 124980,
      totalViews: 9_403_920,
      monthlyRevenue: 8430.50,
      watchTimeHours: 482090,
      videoPerformance: [
        { videoId: 'f1', title: 'Inception', views: 4_520_930, earnings: 4050.20 },
        { videoId: 'f2', title: 'Interstellar', views: 3_209_340, earnings: 2880.30 },
        { videoId: 'f3', title: 'The Dark Knight', views: 1_673_650, earnings: 1500.00 },
      ],
    };
  },

  // Creator Video Upload
  uploadVideo: async (
    title: string,
    description: string,
    genre: string,
    tier: 'FREE' | 'BASIC' | 'PREMIUM',
    videoFileUri: string,
    thumbnailFileUri: string,
  ): Promise<Video> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: `f-user-${Date.now()}`,
      title,
      description,
      thumbnailUrl: thumbnailFileUri || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      videoUrl: videoFileUri || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: 320,
      views: 0,
      likes: 0,
      dislikes: 0,
      genre,
      creatorId: 'user-01',
      creatorName: 'Nairobi Creator Studio',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      uploadedAt: new Date().toISOString(),
      resolution: '1080p',
      tier,
      subtitles: [],
    };
  },

  // ── Watchlist API ──────────────────────────────────────────────────────────
  getWatchlist: async (): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_VIDEOS.filter((v) => watchlist.has(v.id));
  },

  addToWatchlist: async (videoId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    watchlist.add(videoId);
  },

  removeFromWatchlist: async (videoId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    watchlist.delete(videoId);
  },

  isInWatchlist: (videoId: string): boolean => watchlist.has(videoId),

  // ── Notifications ──────────────────────────────────────────────────────────
  getNotifications: async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [
      { id: 'n1', type: 'new_release', title: 'New Release', body: 'Dune: Part Three drops tomorrow!', read: false, timestamp: '2026-06-18T06:00:00Z' },
      { id: 'n2', type: 'subscription', title: 'Subscription Renewed', body: 'Your Premium plan was renewed for $14.99.', read: false, timestamp: '2026-06-17T12:00:00Z' },
      { id: 'n3', type: 'live', title: 'Cyber Studios is Live', body: 'Your subscribed creator just went live!', read: true, timestamp: '2026-06-16T20:00:00Z' },
    ];
  },

  getNotificationBadge: (): number => notificationBadge,

  markNotificationsRead: async (): Promise<void> => {
    notificationBadge = 0;
  },

  // ── Trending Charts ─────────────────────────────────────────────────────────
  getTrendingChart: async (): Promise<{ rank: number; video: Video; change: 'up' | 'down' | 'new' }[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const films = MOCK_VIDEOS.filter((v) => !v.isReel && !v.isLive);
    return films.slice(0, 10).map((v, i) => ({
      rank: i + 1,
      video: v,
      change: i < 3 ? 'up' : i < 6 ? 'new' : 'down',
    }));
  },
};
