export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  duration: number; // in seconds
  resolution: string;
  fileSize: number; // in bytes
  fileName: string;
  filePath?: string;
  streamUrl?: string;
  thumbnailUrl: string;
  uploadedAt: string;
  creatorEmail: string;
  creatorName: string;
  views: number;
  likes: number;
  downloads: number;
  comments: Comment[];
  isSample?: boolean;
}

export interface OfflineVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  fileSize: number;
  resolution: string;
  thumbnailDataUrl: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  savedAt: string;
  blob: Blob;
  blobUrl?: string;
}

export interface CreatorUser {
  email: string;
  name: string;
  role: 'creator';
  avatar: string;
}
