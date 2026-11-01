import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  HardDriveDownload,
  Download,
  Settings,
  Check,
  Loader2,
  PictureInPicture2,
  Tv,
} from 'lucide-react';
import { VideoItem, OfflineVideo } from '../types';
import { saveVideoOffline, isVideoSavedOffline, formatDuration } from '../lib/offlineStorage';
import { DinoControlBar } from './DinoControlBar';

interface VideoPlayerProps {
  video: VideoItem | OfflineVideo;
  isOfflineMode?: boolean;
  onDownloadRequested?: (v: VideoItem | OfflineVideo) => void;
  onSavedOfflineSuccess?: (offline: OfflineVideo) => void;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isOfflineMode = false,
  onDownloadRequested,
  onSavedOfflineSuccess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  const triggerDinoJump = () => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 380);
  };

  // Gesture feedback state
  const [tapFeedback, setTapFeedback] = useState<{
    side: 'left' | 'right' | null;
    visible: boolean;
  }>({ side: null, visible: false });

  // Offline save state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Determine stream source URL
  // If it's already an offline video with blobUrl, use that! Otherwise stream route or streamUrl
  const videoSrc =
    (video as OfflineVideo).blobUrl ||
    video.streamUrl ||
    `/api/videos/${video.id}/stream`;
  
  const posterSrc =
    video.thumbnailUrl ||
    (video as OfflineVideo).thumbnailDataUrl;

  // Check if saved offline
  useEffect(() => {
    let active = true;
    isVideoSavedOffline(video.id).then((saved) => {
      if (active) setIsSaved(saved);
    });
    return () => {
      active = false;
    };
  }, [video.id]);

  // Handle controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying, resetControlsTimer]);

  // Video element event listeners
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      // Update buffered range
      if (el.buffered.length > 0 && el.duration > 0) {
        const bufferedEnd = el.buffered.end(el.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / el.duration) * 100));
      }
    };

    const onLoadedMetadata = () => {
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('playing', onPlaying);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Sync view count on mount (once)
  useEffect(() => {
    if (!isOfflineMode && video.id && !video.id.startsWith('seed-')) {
      fetch(`/api/videos/${video.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [video.id, isOfflineMode]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.warn);
    } else {
      videoRef.current.pause();
    }
    resetControlsTimer();
  };

  const seekRelative = (seconds: number, side: 'left' | 'right') => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    triggerDinoJump();
    
    // Trigger visual feedback for double tap / seek
    setTapFeedback({ side, visible: true });
    setTimeout(() => {
      setTapFeedback({ side: null, visible: false });
    }, 700);
    resetControlsTimer();
  };

  // Mobile double-tap detector
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const handleTouchScreen = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = touch.clientX - rect.left;
    const width = rect.width;

    if (now - lastTapRef.current.time < 300) {
      // Double tap detected!
      if (tapX < width * 0.35) {
        seekRelative(-10, 'left');
      } else if (tapX > width * 0.65) {
        seekRelative(10, 'right');
      } else {
        togglePlay();
      }
    } else {
      // Single tap: toggle controls visibility
      setShowControls((prev) => !prev);
      resetControlsTimer();
    }
    lastTapRef.current = { time: now, x: tapX };
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickPos = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const targetRatio = clickPos / rect.width;
    const newTime = targetRatio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerDinoJump();
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not supported or failed:', err);
    }
  };

  // Save for Offline
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

  // Direct download trigger
  const handleDownload = () => {
    if (onDownloadRequested) {
      onDownloadRequested(video);
      return;
    }
    const cleanTitle = video.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const a = document.createElement('a');
    a.href = (video as OfflineVideo).blobUrl || `/api/videos/${video.id}/download`;
    a.download = `${cleanTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in comments or inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        seekRelative(-10, 'left');
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        seekRelative(10, 'right');
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isMuted, volume]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full overflow-hidden bg-black select-none transition-all duration-300 ${
        isTheater ? 'max-h-[85vh] h-[75vh]' : 'aspect-video max-h-[75vh] rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-800'
      }`}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        playsInline
        preload="auto"
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Mobile Touch Area with double-tap listeners */}
      <div
        onTouchEnd={handleTouchScreen}
        className="absolute inset-0 pointer-events-auto md:pointer-events-none"
      />

      {/* Double Tap Visual Animation Feedbacks */}
      {tapFeedback.visible && tapFeedback.side === 'left' && (
        <div className="absolute top-1/2 left-6 sm:left-8 -translate-y-1/2 flex flex-col items-center justify-center p-3 sm:p-4 rounded-full bg-black/70 backdrop-blur-md text-white animate-scale-pulse pointer-events-none z-30">
          <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 animate-spin-reverse" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">-10s</span>
        </div>
      )}
      {tapFeedback.visible && tapFeedback.side === 'right' && (
        <div className="absolute top-1/2 right-6 sm:right-8 -translate-y-1/2 flex flex-col items-center justify-center p-3 sm:p-4 rounded-full bg-black/70 backdrop-blur-md text-white animate-scale-pulse pointer-events-none z-30">
          <RotateCw className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 animate-spin" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">+10s</span>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Big Play/Pause Center Indicator */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm transition transform hover:scale-110 active:scale-95 z-20"
        >
          <Play className="w-7 h-7 sm:w-10 sm:h-10 ml-1 fill-white" />
        </button>
      )}

      {/* Top Bar Overlay: Title & Badges */}
      <div
        className={`absolute top-0 inset-x-0 p-2.5 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 max-w-[65%] sm:max-w-[70%]">
          <span className="text-xs sm:text-base font-semibold text-white truncate drop-shadow">
            {video.title}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold bg-indigo-500/80 text-white uppercase tracking-wider flex-shrink-0">
            {video.resolution || '1080p'}
          </span>
        </div>

        {/* Quick action buttons in top-right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Offline Save Action */}
          <button
            onClick={handleSaveOffline}
            disabled={isSaved || isSaving}
            className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition ${
              isSaved
                ? 'bg-emerald-600/80 text-white'
                : isSaving
                ? 'bg-indigo-600/80 text-white cursor-wait'
                : 'bg-black/50 hover:bg-black/70 text-slate-200 hover:text-white border border-white/10'
            }`}
            title={isSaved ? 'Saved to Offline Library' : 'Save for Offline viewing'}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">Saved</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                <span className="text-[11px]">{saveProgress}%</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Save</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-black/50 hover:bg-black/70 text-slate-200 hover:text-white border border-white/10 backdrop-blur-md transition"
            title="Download video file directly to your device"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Dino Game Animated Control Bar */}
      <DinoControlBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        bufferedPercent={bufferedPercent}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        isFullscreen={isFullscreen}
        isTheater={isTheater}
        showControls={showControls}
        isJumping={isJumping}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onSeekRelative={seekRelative}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        onChangeSpeed={changeSpeed}
        onToggleFullscreen={toggleFullscreen}
        onToggleTheater={() => setIsTheater(!isTheater)}
        onTogglePiP={togglePiP}
      />
    </div>
  );
};
