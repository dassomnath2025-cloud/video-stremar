import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Download,
  HardDriveDownload,
  Check,
  MessageSquare,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { VideoItem, OfflineVideo, CreatorUser } from '../types';
import { saveVideoOffline, isVideoSavedOffline, formatFileSize } from '../lib/offlineStorage';

interface VideoDetailsProps {
  video: VideoItem | OfflineVideo;
  isOfflineMode?: boolean;
  creatorSession: CreatorUser | null;
  onLikeVideo?: (id: string) => void;
  onDeleteVideo?: (id: string) => void;
  onDownload: (video: VideoItem | OfflineVideo) => void;
  onSavedOfflineSuccess?: (offline: OfflineVideo) => void;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({
  video,
  isOfflineMode = false,
  creatorSession,
  onLikeVideo,
  onDeleteVideo,
  onDownload,
  onSavedOfflineSuccess,
}) => {
  const [likes, setLikes] = useState((video as VideoItem).likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState((video as VideoItem).comments || []);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  React.useEffect(() => {
    let active = true;
    isVideoSavedOffline(video.id).then((saved) => {
      if (active) setIsSaved(saved);
    });
    return () => {
      active = false;
    };
  }, [video.id]);

  const handleLike = async () => {
    if (hasLiked || isOfflineMode) return;
    setLikes((prev) => prev + 1);
    setHasLiked(true);
    onLikeVideo?.(video.id);
    try {
      await fetch(`/api/videos/${video.id}/like`, { method: 'POST' });
    } catch (e) {
      console.warn('Like sync failed:', e);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveOffline = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    setSaveProgress(5);
    try {
      const offlineItem = await saveVideoOffline(video as VideoItem, (percent) => {
        setSaveProgress(percent);
      });
      setIsSaved(true);
      setIsSaving(false);
      onSavedOfflineSuccess?.(offlineItem);
    } catch (err) {
      console.error('Failed to save video offline:', err);
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment || isOfflineMode) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'Viewer',
          content: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isCreatorOfThis = creatorSession?.email === (video as VideoItem).creatorEmail;

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          {video.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-xs">
              {video.category}
            </span>
            <span className="font-mono text-slate-300">
              {((video as VideoItem).views || 0).toLocaleString()} views
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date((video as VideoItem).uploadedAt || (video as OfflineVideo).savedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={isOfflineMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                hasLiked
                  ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likes.toLocaleString()}</span>
            </button>

            {/* Save Offline */}
            <button
              onClick={handleSaveOffline}
              disabled={isSaved || isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                isSaved
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : isSaving
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 cursor-wait'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Save for offline viewing"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>{saveProgress}%</span>
                </>
              ) : (
                <>
                  <HardDriveDownload className="w-4 h-4 text-cyan-400" />
                  <span>Save Offline</span>
                </>
              )}
            </button>

            {/* Download */}
            <button
              onClick={() => onDownload(video)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Download video file to device"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download</span>
              <span className="text-[10px] text-slate-500">
                ({formatFileSize(video.fileSize)})
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            {/* Delete Button */}
            {onDeleteVideo && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this video from StreamVault?')) {
                    onDeleteVideo(video.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition"
                title="Remove video from catalog"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploader Info Box */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={
              (video as VideoItem).creatorName === 'Somnath Das'
                ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
                : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                    (video as VideoItem).creatorName || 'Creator'
                  )}`
            }
            alt={(video as VideoItem).creatorName || 'Creator'}
            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40 bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">
                {(video as VideoItem).creatorName || 'Community Creator'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                UPLOADER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {(video as VideoItem).creatorEmail || 'community@streamvault.app'} • Published Video
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Channel</span>
        </div>
      </div>

      {/* Description & Tags */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
          About this Video
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {video.description || 'No description provided by creator.'}
        </p>

        {(video as VideoItem).tags && (video as VideoItem).tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {(video as VideoItem).tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-medium text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Viewer Comments Section (when online) */}
      {!isOfflineMode && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Comments ({comments.length})</span>
          </div>

          {/* New Comment Box */}
          <form onSubmit={handleAddComment} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your Name (optional)"
                className="w-48 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this video..."
                rows={2}
                required
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Post Comment</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-start gap-3"
              >
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-8 h-8 rounded-full bg-slate-800 object-cover flex-shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
