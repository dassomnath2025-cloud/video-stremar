import React, { useState, useEffect } from 'react';
import { Play, Download, HardDriveDownload, Check, Eye, Heart, Clock, Loader2 } from 'lucide-react';
import { VideoItem, OfflineVideo } from '../types';
import { formatDuration, isVideoSavedOffline, saveVideoOffline } from '../lib/offlineStorage';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
  onDownload: (video: VideoItem) => void;
  onSavedOffline?: (video: OfflineVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelect,
  onDownload,
  onSavedOffline,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  useEffect(() => {
    let active = true;
    isVideoSavedOffline(video.id).then((saved) => {
      if (active) setIsSaved(saved);
    });
    return () => {
      active = false;
    };
  }, [video.id]);

  const handleSaveOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved || isSaving) return;
    setIsSaving(true);
    setSaveProgress(5);
    try {
      const offlineItem = await saveVideoOffline(video, (percent) => {
        setSaveProgress(percent);
      });
      setIsSaved(true);
      setIsSaving(false);
      onSavedOffline?.(offlineItem);
    } catch (err) {
      console.error('Failed to save offline:', err);
      setIsSaving(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div
      onClick={() => onSelect(video)}
      className="group relative flex flex-col bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dark overlay with play icon on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Resolution badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
          {video.resolution || 'HD'}
        </div>

        {/* Offline saved badge */}
        {isSaved && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-xs">
            <Check className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Video Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-400">
              {video.category}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(video.uploadedAt)}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-indigo-300 line-clamp-2 leading-snug transition-colors">
            {video.title}
          </h3>

          <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Footer Meta & Quick Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              {video.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500/70" />
              {video.likes.toLocaleString()}
            </span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Save Offline Button */}
            <button
              onClick={handleSaveOffline}
              disabled={isSaved || isSaving}
              className={`p-1.5 rounded-lg border transition ${
                isSaved
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : isSaving
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 cursor-wait'
                  : 'border-slate-800 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isSaved ? 'Video is saved for offline viewing' : 'Save for offline viewing'}
            >
              {isSaved ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <HardDriveDownload className="w-4 h-4" />
              )}
            </button>

            {/* Direct Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(video);
              }}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Download video file to device"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
