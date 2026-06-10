export type UserRole = 'GUEST' | 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  mfaEnabled: boolean;
  biometricsEnabled: boolean;
  accessToken: string;
  refreshToken: string;
  devices: DeviceSession[];
}

export interface DeviceSession {
  id: string;
  name: string;
  lastActive: string;
  current: boolean;
}

export type VideoTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  views: number;
  likes: number;
  dislikes: number;
  genre: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  uploadedAt: string;
  resolution: string; // '4K' | '1080p' | '720p' etc
  tier: VideoTier;
  subtitles: { label: string; src: string; language: string }[];
  isReel?: boolean; // TikTok/Reels flag
  isLive?: boolean; // Live streaming flag
  liveViewerCount?: number;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  likes: number;
  createdAt: string;
  isPinned?: boolean;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface CreatorAnalytics {
  subscribersCount: number;
  totalViews: number;
  monthlyRevenue: number;
  watchTimeHours: number;
  videoPerformance: { videoId: string; title: string; views: number; earnings: number }[];
}

export interface DownloadTask {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  progress: number; // 0 to 100
  status: 'ENQUEUED' | 'DOWNLOADING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  localUri?: string;
  sizeBytes: number;
  quality: '360p' | '720p' | '1080p';
}

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PREMIUM' | 'FAMILY' | 'STUDENT';

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'CANCELLED';
  expiresAt: string;
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'MPESA' | 'APPLE_PAY' | 'GOOGLE_PAY' | null;
  billingAmount: number;
  autoRenew: boolean;
}

export interface LiveChatEvent {
  id: string;
  username: string;
  avatarUrl: string;
  message: string;
  timestamp: string;
  donationAmount?: number; // Super chats support
}
