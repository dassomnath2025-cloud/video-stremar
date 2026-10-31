import React, { useEffect, useState } from 'react';
import {
  HardDriveDownload,
  Trash2,
  Play,
  HardDrive,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { OfflineVideo } from '../types';
import {
  getOfflineVideos,
  removeOfflineVideo,
  getStorageQuota,
  formatDuration,
  formatFileSize,
} from '../lib/offlineStorage';

interface OfflineLibraryProps {
  onPlayVideo: (video: OfflineVideo) => void;
  onClose?: () => void;
}

export const OfflineLibrary: React.FC<OfflineLibraryProps> = ({
  onPlayVideo,
}) => {
  const [offlineVideos, setOfflineVideos] = useState<OfflineVideo[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    usedFormatted: string;
    quotaFormatted: string;
    percentageUsed: number;
    usedBytes: number;
  }>({
    usedFormatted: '0 MB',
    quotaFormatted: 'Unknown',
    percentageUsed: 0,
    usedBytes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const videos = await getOfflineVideos();
      setOfflineVideos(videos);
      const quota = await getStorageQuota();
      setStorageInfo(quota);
    } catch (err) {
      console.error('Error loading offline library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this video from offline storage?')) {
      await removeOfflineVideo(id);
      loadData();
    }
  };

  const handleClearAll = async () => {
    if (offlineVideos.length === 0) return;
    if (confirm(`Remove all ${offlineVideos.length} offline videos to free storage?`)) {
      for (const v of offlineVideos) {
        await removeOfflineVideo(v.id);
      }
      loadData();
    }
  };

  const handleDownloadBlob = (video: OfflineVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.blobUrl) return;
    const a = document.createElement('a');
    a.href = video.blobUrl;
    a.download = `${video.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header & Storage Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HardDriveDownload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Offline Video Library
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  {offlineVideos.length} Saved
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Videos saved locally on your device for uninterrupted streaming without internet.
              </p>
            </div>
          </div>

          {offlineVideos.length > 0 && (
            <button
              onClick={handleClearAll}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Storage</span>
            </button>
          )}
        </div>

        {/* Device Storage Status Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Device Storage Used by StreamVault:</span>
              <strong className="text-white font-mono">{storageInfo.usedFormatted}</strong>
            </div>
            <span className="text-slate-400">Quota: {storageInfo.quotaFormatted}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.max(2, storageInfo.percentageUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Videos List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm">Accessing local device storage...</p>
        </div>
      ) : offlineVideos.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-4">
            <HardDriveDownload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Offline Videos Yet</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Tap the <span className="text-indigo-400 font-semibold">Save Offline</span> button on any video in the home catalog to watch it when traveling, on flights, or in areas with poor mobile reception.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {offlineVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => onPlayVideo(video)}
              className="group relative flex flex-col bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={video.thumbnailDataUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 ml-0.5 fill-white" />
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono">
                  {formatDuration(video.duration)}
                </div>

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>OFFLINE</span>
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-slate-200 text-[10px] font-mono">
                  {formatFileSize(video.fileSize)}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-white group-hover:text-emerald-400 line-clamp-2 transition-colors">
                    {video.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {video.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Saved {new Date(video.savedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadBlob(video, e)}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Export video file to Downloads folder"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(video.id, e)}
                      className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                      title="Remove from offline storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
