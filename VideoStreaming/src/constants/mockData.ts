import { Video, SubscriptionPlan } from '../types';

export const MOCK_VIDEOS: Video[] = [
  // Trending / Featured movies
  {
    id: 'f1',
    title: 'Sintel - The Awakening',
    description: 'A lonely young woman named Sintel searches for her companion, a baby dragon named Scales, whom she saved from injury but who was later snatched by an adult dragon. Her journey takes her to the ends of the earth.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: 888,
    views: 4520930,
    likes: 298000,
    dislikes: 1200,
    genre: 'Fantasy',
    creatorId: 'c-blender',
    creatorName: 'Blender Foundation',
    creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-10T08:00:00Z',
    resolution: '4K HDR',
    tier: 'PREMIUM',
    subtitles: [
      { label: 'English (CC)', src: 'en-cc', language: 'en' },
      { label: 'Español', src: 'es-cc', language: 'es' },
      { label: 'Français', src: 'fr-cc', language: 'fr' }
    ]
  },
  {
    id: 'f2',
    title: 'Tears of Steel - Sci-Fi Thriller',
    description: 'Set in a dystopian future where human resistance fights against robotic overlords. A group of scientists and soldiers attempt to reprogram a giant machine by using memory projection.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734,
    views: 12093400,
    likes: 852000,
    dislikes: 4200,
    genre: 'Sci-Fi',
    creatorId: 'c-blender',
    creatorName: 'Blender Foundation',
    creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-02-14T12:00:00Z',
    resolution: '1080p',
    tier: 'FREE',
    subtitles: [
      { label: 'English', src: 'en', language: 'en' },
      { label: 'Kiswahili', src: 'sw', language: 'sw' }
    ]
  },
  {
    id: 'f3',
    title: 'Big Buck Bunny - Forest Chronicles',
    description: 'A giant forest rabbit gets pushed to the limit when a trio of rodents bullies the wildlife around him. He plots a highly strategic, comical revenge.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596,
    views: 89000000,
    likes: 2400000,
    dislikes: 15000,
    genre: 'Animation',
    creatorId: 'c-blender',
    creatorName: 'Blender Foundation',
    creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2025-11-01T09:00:00Z',
    resolution: '4K Dolby Vision',
    tier: 'BASIC',
    subtitles: [
      { label: 'English', src: 'en', language: 'en' }
    ]
  },
  {
    id: 'f4',
    title: 'Subaru WRX - Mountain Drift Show',
    description: 'Experience professional drifters attacking dangerous mountain passes under heavy downpours. Shot with high-speed 8K cameras and specialized microphones for immersive sound.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 120,
    views: 310500,
    likes: 24000,
    dislikes: 80,
    genre: 'Motorsports',
    creatorId: 'c-speed',
    creatorName: 'Apex Racing',
    creatorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-05-20T17:45:00Z',
    resolution: '1080p',
    tier: 'FREE',
    subtitles: []
  },

  // Reels (Short-Form Vertical Videos)
  {
    id: 'r1',
    title: 'Satisfying Kinetic Art Installation 🌀 #kinetic #art #oddlysatisfying',
    description: 'Watch this stunning custom metallic pendulum trace geometric patterns. Created over 120 hours of precise engineering.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    views: 1200349,
    likes: 95400,
    dislikes: 120,
    genre: 'Art',
    creatorId: 'c-satisfying',
    creatorName: 'MindBend Art',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-06-01T10:00:00Z',
    resolution: '1080p',
    tier: 'FREE',
    subtitles: [],
    isReel: true
  },
  {
    id: 'r2',
    title: 'Ultimate Nairobi Street Food Tour! 🌶️🇰🇪 #streetfood #kenya #yummy',
    description: 'Trying out the legendary Mutura, smokies, and sugarcane juice in CBD! Best budget snacks in town.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 30,
    views: 549302,
    likes: 42090,
    dislikes: 110,
    genre: 'Travel',
    creatorId: 'c-nairobieats',
    creatorName: 'Nairobi Eats',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-06-03T15:20:00Z',
    resolution: '1080p',
    tier: 'FREE',
    subtitles: [],
    isReel: true
  },
  {
    id: 'r3',
    title: 'Coding a Physics Engine in 45 Seconds! 💻🔥 #devtok #coding #javascript',
    description: 'Here is a quick look at implementing verlet integration for collisions. Full repository linked in profile.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 45,
    views: 2904300,
    likes: 310200,
    dislikes: 340,
    genre: 'Tech',
    creatorId: 'c-jscoder',
    creatorName: 'The JS Dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-06-05T18:10:00Z',
    resolution: '1080p',
    tier: 'FREE',
    subtitles: [],
    isReel: true
  },

  // Live Streams
  {
    id: 'l1',
    title: '🔴 E3 Gaming Showcase Live - Cybernetic 2077 Walkthrough',
    description: 'We are live demonstrating the next-generation DLC update, running on extreme raytracing settings. Drop your questions and super chats!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 0,
    views: 23500,
    likes: 8900,
    dislikes: 45,
    genre: 'Gaming',
    creatorId: 'c-cyber',
    creatorName: 'Cyber Studios',
    creatorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-06-09T10:00:00Z',
    resolution: '4K Low Latency',
    tier: 'FREE',
    subtitles: [],
    isLive: true,
    liveViewerCount: 14890
  },
  {
    id: 'l2',
    title: '🔴 Lofi Chill Beats for Coding/Studying 📚 [24/7 Radio]',
    description: 'Kick back, load your terminal, and relax. Standard lofi instrumentals synced with custom generative anime art.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 0,
    views: 843000,
    likes: 120300,
    dislikes: 120,
    genre: 'Music',
    creatorId: 'c-chill',
    creatorName: 'Chillout Sound',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    uploadedAt: '2026-06-09T00:00:00Z',
    resolution: '1080p Low Latency',
    tier: 'FREE',
    subtitles: [],
    isLive: true,
    liveViewerCount: 3840
  }
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Free Trial',
    price: 0,
    features: ['Standard definition streaming', 'Access to trailers and public reviews', 'Ad-supported playback'],
    billingPeriod: '1 Month'
  },
  {
    id: 'BASIC',
    name: 'Basic Streamer',
    price: 7.99,
    features: ['High Definition (HD)', 'Watch on 1 supported device', 'Unlimited downloads offline', 'No advertisements'],
    billingPeriod: 'Month'
  },
  {
    id: 'PREMIUM',
    name: 'Premium Cinema',
    price: 14.99,
    features: ['Ultra HD 4K + HDR streaming', 'Watch on 4 supported devices', 'Dolby Atmos Spatial Audio', 'Exclusive Premium releases', 'Offline viewing queue scheduling'],
    billingPeriod: 'Month'
  },
  {
    id: 'FAMILY',
    name: 'Family Multipass',
    price: 19.99,
    features: ['Ultra HD 4K + HDR', 'Watch on 6 simultaneous screens', 'Kids safety filtering options', 'Shared collaborative playlists'],
    billingPeriod: 'Month'
  },
  {
    id: 'STUDENT',
    name: 'Campus Bundle',
    price: 4.99,
    features: ['Full Premium benefits at 70% off', 'Academic email verification required', 'Access to online campus panels'],
    billingPeriod: 'Month'
  }
];
