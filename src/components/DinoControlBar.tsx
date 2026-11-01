import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Check,
  PictureInPicture2,
  Tv,
} from 'lucide-react';

interface DinoControlBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isTheater: boolean;
  showControls: boolean;
  isJumping: boolean;
  onTogglePlay: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onSeekRelative: (seconds: number, side: 'left' | 'right') => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onChangeSpeed: (rate: number) => void;
  onToggleFullscreen: () => void;
  onToggleTheater: () => void;
  onTogglePiP: () => void;
}

// Compact Pixel Art Dino Sprite Component (8-Bit Chrome Dino Runner)
const PixelDino: React.FC<{
  isRunning: boolean;
  isJumping: boolean;
  runFrame: number;
}> = ({ isRunning, isJumping, runFrame }) => {
  return (
    <div
      className={`relative select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-transform ${
        isJumping ? '-translate-y-4 sm:-translate-y-5 rotate-[-5deg]' : 'translate-y-0'
      }`}
      style={{
        transitionDuration: isJumping ? '220ms' : '130ms',
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      <svg
        viewBox="0 0 44 47"
        className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-100"
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Head and Horn */}
        <path d="M22 0h16v2h2v2h2v8h-2v2h-8v-2h-8V8h-2V6h2V0z" />
        {/* Eye (negative space) */}
        <rect x="25" y="2" width="2" height="2" fill="#0f172a" />
        {/* Snout and Mouth */}
        <path d="M34 8h8v2h-8V8zm2 4h4v2h-4v-2z" />
        {/* Neck and Upper Body */}
        <path d="M20 8h2v8h-2V8zm-2 6h2v6h-2v-6zm-4 4h4v6h-4v-6zm-4 4h4v6h-4v-6zm-4 2h4v4H6v-4zm-4 2h4v2H2v-2z" />
        {/* Torso */}
        <path d="M12 20h14v14H12V20z" />
        {/* Arm */}
        <path d="M26 22h4v2h-2v4h-2v-6z" />
        {/* Belly & Tail */}
        <path d="M6 24h6v6H6v-6zm-4 2h4v4H2v-4zm-2 2h2v2H0v-2z" />

        {/* Dynamic Legs */}
        {isJumping ? (
          // Jump Leg Frame (Tucked)
          <path d="M14 34h4v4h-4v-4zm8 0h4v4h-4v-4zm-4 4h2v2h-2v-2zm8 0h2v2h-2v-2z" />
        ) : !isRunning ? (
          // Idle / Paused Frame (Standing straight)
          <path d="M14 34h4v6h4v2h-6v-2h-2v-6zm8 0h4v6h4v2h-6v-2h-2v-6z" />
        ) : runFrame === 0 ? (
          // Running Frame A
          <path d="M14 34h4v4h4v2h-4v2h-4v-8zm8 0h4v8h-2v2h-2v-10z" />
        ) : (
          // Running Frame B
          <path d="M14 34h4v8h-2v2h-2v-10zm8 0h4v4h4v2h-4v2h-4v-8z" />
        )}
      </svg>

      {/* Subtle Dust particles while running */}
      {isRunning && !isJumping && (
        <div className="absolute -bottom-0.5 -left-1.5 flex gap-0.5 opacity-75">
          <div className="w-0.5 h-0.5 bg-amber-400 rounded-none" />
          <div className="w-0.5 h-0.5 bg-amber-300/60 rounded-none" />
        </div>
      )}

      {/* Jump Dust Ring */}
      {isJumping && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-400/50 rounded-full blur-[0.5px]" />
      )}
    </div>
  );
};

// Compact Pixel Cactus Obstacle
const PixelCactus: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  return (
    <svg
      viewBox="0 0 25 32"
      className={`fill-emerald-400/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${
        size === 'sm' ? 'w-2 h-3 sm:w-2.5 sm:h-3.5' : size === 'lg' ? 'w-3 h-4.5 sm:w-3.5 sm:h-5' : 'w-2.5 h-3.5 sm:w-3 sm:h-4'
      }`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      <rect x="9" y="0" width="7" height="32" />
      <rect x="2" y="8" width="5" height="14" />
      <rect x="2" y="16" width="9" height="6" />
      <rect x="18" y="12" width="5" height="12" />
      <rect x="14" y="18" width="9" height="6" />
    </svg>
  );
};

// Compact Pixel Cloud
const PixelCloud: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 48 16"
    className={`fill-white/25 ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    <rect x="12" y="0" width="16" height="4" />
    <rect x="8" y="4" width="24" height="4" />
    <rect x="0" y="8" width="44" height="4" />
    <rect x="4" y="12" width="40" height="4" />
  </svg>
);

// Compact Pixel Pterodactyl Bird
const PixelBird: React.FC<{ flap: number; className?: string }> = ({ flap, className = '' }) => (
  <svg
    viewBox="0 0 36 24"
    className={`fill-amber-300/70 ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    <rect x="12" y="8" width="16" height="6" />
    <rect x="28" y="10" width="8" height="2" />
    <rect x="8" y="10" width="4" height="4" />
    {flap === 0 ? (
      <path d="M14 0h6v8h-6V0zm-4 4h4v4h-4V4z" />
    ) : (
      <path d="M14 14h6v8h-6v-8zm-4 0h4v4h-4v-4z" />
    )}
  </svg>
);

export const DinoControlBar: React.FC<DinoControlBarProps> = ({
  isPlaying,
  currentTime,
  duration,
  bufferedPercent,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  isTheater,
  showControls,
  isJumping,
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onChangeSpeed,
  onToggleFullscreen,
  onToggleTheater,
  onTogglePiP,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [runFrame, setRunFrame] = useState(0);
  const [birdFlap, setBirdFlap] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setRunFrame((prev) => (prev === 0 ? 1 : 0));
      setBirdFlap((prev) => (prev === 0 ? 1 : 0));
    }, 150 / playbackRate);
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatArcadeScore = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  };

  const handleMouseMoveProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverPosition((pos / rect.width) * duration);
  };

  const handleTouchProgress = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const touch = e.touches[0];
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    setHoverPosition((pos / rect.width) * duration);
    onSeek(e);
  };

  return (
    <div
      className={`absolute bottom-0 inset-x-0 p-1.5 sm:p-2.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 z-30 font-mono ${
        showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Dino Game Scrubber Track Zone (Compact & Mobile-Adjusted) */}
      <div className="relative mb-1 sm:mb-1.5 pt-2 sm:pt-3 px-0.5 sm:px-1">
        {/* Sky Elements (Subtle & Petite) */}
        <div className="absolute top-0 inset-x-0 h-4 overflow-hidden pointer-events-none flex justify-between px-3 opacity-40">
          <PixelCloud className="w-5 h-1.5 sm:w-8 sm:h-2.5" />
          <PixelBird flap={birdFlap} className="w-3.5 h-2.5 sm:w-5 sm:h-3.5 ml-3" />
          <PixelCloud className="w-6 h-1.5 sm:w-9 sm:h-2.5 hidden sm:block" />
        </div>

        {/* Hover preview tooltip */}
        {hoverPosition !== null && (
          <div
            className="absolute -top-3.5 px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-bold shadow -translate-x-1/2 pointer-events-none z-40 border border-black"
            style={{
              left: `${Math.max(4, Math.min(96, (hoverPosition / duration) * 100))}%`,
            }}
          >
            {formatArcadeScore(hoverPosition)}
          </div>
        )}

        {/* Main Track Container with Fluid Touch Scrubbing */}
        <div
          ref={progressBarRef}
          onClick={onSeek}
          onMouseMove={handleMouseMoveProgress}
          onMouseLeave={() => setHoverPosition(null)}
          onTouchStart={handleTouchProgress}
          onTouchMove={handleTouchProgress}
          onTouchEnd={() => setHoverPosition(null)}
          className="relative group w-full h-7 sm:h-8 cursor-pointer flex items-end pb-1 touch-none"
        >
          {/* Ground Track Line */}
          <div className="absolute bottom-1.5 inset-x-0 h-[2px] bg-slate-700/80 rounded-none overflow-hidden">
            {/* Buffered Track Progress */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-slate-500/40"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Ground Fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 to-indigo-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Ground texture dashed dots */}
          <div
            className="absolute bottom-0.5 inset-x-0 h-[1px] opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '10px 1px',
            }}
          />

          {/* Compact Pixel Cacti */}
          <div className="absolute bottom-1.5 left-[25%] -translate-x-1/2 pointer-events-none z-10 opacity-70">
            <PixelCactus size="sm" />
          </div>
          <div className="absolute bottom-1.5 left-[50%] -translate-x-1/2 pointer-events-none z-10 opacity-70">
            <PixelCactus size="md" />
          </div>
          <div className="absolute bottom-1.5 left-[75%] -translate-x-1/2 pointer-events-none z-10 opacity-70">
            <PixelCactus size="lg" />
          </div>
          <div className="absolute bottom-1.5 left-[92%] -translate-x-1/2 pointer-events-none z-10 opacity-70">
            <PixelCactus size="sm" />
          </div>

          {/* COMPACT ANIMATED RUNNING DINO */}
          <div
            className="absolute bottom-1.5 -translate-x-1/2 pointer-events-none z-20 transition-all ease-out"
            style={{
              left: `${Math.max(1, Math.min(99, progressPercent))}%`,
            }}
          >
            <PixelDino
              isRunning={isPlaying}
              isJumping={isJumping}
              runFrame={runFrame}
            />
          </div>
        </div>
      </div>

      {/* Control Buttons & Scoreboard Row (Compact) */}
      <div className="flex items-center justify-between text-slate-200 text-xs gap-1">
        {/* Left Side: Buttons & Score */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="p-1.5 sm:p-1.5 rounded-md bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-400 active:scale-90 transition touch-manipulation flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
            )}
          </button>

          {/* Skip -10s */}
          <button
            onClick={() => onSeekRelative(-10, 'left')}
            className="p-1 sm:p-1 rounded-md bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:text-white transition touch-manipulation active:scale-90 flex-shrink-0"
            title="Rewind 10s"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => onSeekRelative(10, 'right')}
            className="p-1 sm:p-1 rounded-md bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:text-white transition touch-manipulation active:scale-90 flex-shrink-0"
            title="Forward 10s"
          >
            <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol flex-shrink-0">
            <button
              onClick={onToggleMute}
              className="p-1 sm:p-1 rounded-md bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-300 touch-manipulation"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-12 sm:w-14 h-1 accent-amber-400 bg-slate-700 rounded-none cursor-pointer hidden group-hover/vol:inline-block sm:inline-block transition"
            />
          </div>

          {/* Time Score */}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[9px] sm:text-[11px] flex-shrink-0">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">
              T
            </span>
            <span className="text-white font-mono">{formatArcadeScore(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 font-mono">{formatArcadeScore(duration)}</span>
          </div>
        </div>

        {/* Right Side: Speed, PiP, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Dino Badge */}
          <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
            <span>DINO</span>
          </div>

          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-0.5 transition"
            >
              <Settings className="w-2.5 h-2.5 sm:hidden" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 py-1 w-20 rounded-lg bg-slate-900 border border-slate-700 shadow-xl backdrop-blur-md flex flex-col z-40">
                <div className="px-2 py-0.5 text-[9px] uppercase font-bold text-amber-400 border-b border-slate-800">
                  SPEED
                </div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangeSpeed(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2 py-0.5 text-[10px] text-left hover:bg-amber-500/20 flex items-center justify-between ${
                      playbackRate === rate ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                    }`}
                  >
                    <span>{rate}x</span>
                    {playbackRate === rate && <Check className="w-2.5 h-2.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP */}
          <button
            onClick={onTogglePiP}
            className="p-1 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:text-white transition hidden sm:inline-flex"
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="w-3.5 h-3.5" />
          </button>

          {/* Theater Mode */}
          <button
            onClick={onToggleTheater}
            className="p-1 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:text-white transition hidden md:inline-flex"
            title={isTheater ? 'Default view' : 'Theater mode'}
          >
            <Tv className={`w-3.5 h-3.5 ${isTheater ? 'text-amber-400' : ''}`} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-1 sm:p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-400 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
