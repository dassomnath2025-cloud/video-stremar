import { VideoItem, OfflineVideo } from '../types';

const DB_NAME = 'StreamVaultOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_videos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this browser.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Convert image url to base64 for reliable offline thumbnail storage
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Download and cache video blob into IndexedDB with real-time download progress
 */
export function saveVideoOffline(
  video: VideoItem,
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<OfflineVideo> {
  return new Promise(async (resolve, reject) => {
    try {
      // Always route through local server endpoint to guarantee no CORS or 403 blocks
      const targetUrl = `/api/videos/${video.id}/stream`;
      const thumbData = await imageUrlToBase64(video.thumbnailUrl || '');

      const xhr = new XMLHttpRequest();
      xhr.open('GET', targetUrl, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percent, event.loaded, event.total);
        } else {
          const est = video.fileSize || 5000000;
          const percent = Math.min(95, Math.round((event.loaded / est) * 100));
          onProgress?.(percent, event.loaded, est);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response as Blob;
          if (!blob || blob.size === 0) {
            return reject(new Error('Received empty video stream.'));
          }

          const offlineItem: OfflineVideo = {
            id: video.id,
            title: video.title,
            description: video.description,
            category: video.category,
            duration: video.duration,
            fileSize: blob.size,
            resolution: video.resolution,
            thumbnailDataUrl: thumbData,
            savedAt: new Date().toISOString(),
            blob: blob,
          };

          const db = await openDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);

          const putReq = store.put(offlineItem);
          putReq.onsuccess = () => {
            offlineItem.blobUrl = URL.createObjectURL(blob);
            resolve(offlineItem);
          };
          putReq.onerror = () => {
            reject(putReq.error);
          };
        } else {
          reject(new Error(`Failed to download video stream. HTTP Status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during video download.'));
      };

      xhr.onabort = () => {
        reject(new Error('Download was cancelled.'));
      };

      xhr.send();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * List all saved offline videos
 */
export async function getOfflineVideos(): Promise<OfflineVideo[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as OfflineVideo[]).map((item) => ({
          ...item,
          blobUrl: item.blob ? URL.createObjectURL(item.blob) : undefined,
        }));
        resolve(results);
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Error getting offline videos:', err);
    return [];
  }
}

/**
 * Check if a video is already saved offline
 */
export async function isVideoSavedOffline(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve(!!req.result);
      };
      req.onerror = () => {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

/**
 * Retrieve a specific offline video with its playable Blob URL
 */
export async function getOfflineVideoById(id: string): Promise<OfflineVideo | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result) {
          const item = req.result as OfflineVideo;
          item.blobUrl = item.blob ? URL.createObjectURL(item.blob) : undefined;
          resolve(item);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Remove video from offline storage
 */
export async function removeOfflineVideo(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

/**
 * Calculate device storage used by offline videos and browser quota
 */
export async function getStorageQuota(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  usedFormatted: string;
  quotaFormatted: string;
  percentageUsed: number;
}> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;

      const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      };

      const percentageUsed = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

      return {
        usedBytes,
        quotaBytes,
        usedFormatted: formatSize(usedBytes),
        quotaFormatted: formatSize(quotaBytes),
        percentageUsed,
      };
    }
  } catch (err) {
    console.warn('Storage estimate error:', err);
  }

  return {
    usedBytes: 0,
    quotaBytes: 0,
    usedFormatted: '0 MB',
    quotaFormatted: 'Unknown',
    percentageUsed: 0,
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
