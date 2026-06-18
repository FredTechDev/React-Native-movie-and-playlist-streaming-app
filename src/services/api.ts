import { Video, Comment, CreatorAnalytics } from '../types';
import { MOCK_VIDEOS } from '../constants/mockData';

// Simulated API service layer. Ready for integration with NestJS/PostgreSQL backend endpoints.
export const apiService = {
  getVideos: async (tier?: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = MOCK_VIDEOS.filter((v) => !v.isReel && !v.isLive);
    if (tier) {
      return list.filter((v) => v.tier === tier);
    }
    return list;
  },

  getReels: async (): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_VIDEOS.filter((v) => v.isReel);
  },

  getLiveStreams: async (): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_VIDEOS.filter((v) => v.isLive);
  },

  getVideoById: async (id: string): Promise<Video | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_VIDEOS.find((v) => v.id === id);
  },

  // Collaborative/Content-based AI recommendation system simulation
  getRecommendedVideos: async (userInterestGenre = 'Fantasy'): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const films = MOCK_VIDEOS.filter((v) => !v.isReel && !v.isLive);
    
    // Sort films so that matching genres come first (content-based), followed by total views (popularity)
    return [...films].sort((a, b) => {
      const aMatch = a.genre.toLowerCase() === userInterestGenre.toLowerCase() ? 1 : 0;
      const bMatch = b.genre.toLowerCase() === userInterestGenre.toLowerCase() ? 1 : 0;
      if (aMatch !== bMatch) {
        return bMatch - aMatch;
      }
      return b.views - a.views;
    });
  },

  // Advanced search with AI/NLP filter parsing simulation
  searchVideos: async (
    query: string,
    filters?: { genre?: string; rating?: string; duration?: 'short' | 'medium' | 'long' }
  ): Promise<Video[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let results = MOCK_VIDEOS.filter((v) => !v.isReel); // standard videos + live

    if (query.trim()) {
      const lower = query.toLowerCase();
      results = results.filter(
        (v) =>
          v.title.toLowerCase().includes(lower) ||
          v.description.toLowerCase().includes(lower) ||
          v.genre.toLowerCase().includes(lower) ||
          v.creatorName.toLowerCase().includes(lower) ||
          (v.director && v.director.toLowerCase().includes(lower)) ||
          (v.cast && v.cast.some((actor) => actor.toLowerCase().includes(lower)))
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

    return results;
  },

  // Comments Mock API
  getCommentsByVideoId: async (videoId: string): Promise<Comment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
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
            content: 'Thank you! It was rendered using path-tracing cycles at 4K resolution with 2048 samples per pixel.',
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
        content: 'Loved the plot twists! Will there be a sequel for this?',
        likes: 32,
        createdAt: '2026-06-08T18:10:00Z',
      },
    ];
  },

  addComment: async (videoId: string, userId: string, username: string, avatarUrl: string, content: string): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
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

  // Creator Dashboard Analytics API Mock
  getCreatorAnalytics: async (creatorId: string): Promise<CreatorAnalytics> => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      subscribersCount: 124980,
      totalViews: 9403920,
      monthlyRevenue: 8430.5,
      watchTimeHours: 482090,
      videoPerformance: [
        { videoId: 'f1', title: 'Sintel - The Awakening', views: 4520930, earnings: 4050.2 },
        { videoId: 'f2', title: 'Tears of Steel - Sci-Fi Thriller', views: 3209340, earnings: 2880.3 },
        { videoId: 'f3', title: 'Big Buck Bunny - Forest Chronicles', views: 1673650, earnings: 1500.0 },
      ],
    };
  },

  // Creator Video Upload Mock API
  uploadVideo: async (
    title: string,
    description: string,
    genre: string,
    tier: 'FREE' | 'BASIC' | 'PREMIUM',
    videoFileUri: string,
    thumbnailFileUri: string
  ): Promise<Video> => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate file transfer delay
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
};
