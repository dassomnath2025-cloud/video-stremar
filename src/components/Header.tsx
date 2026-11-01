import React, { useState } from 'react';
import {
  Search,
  Upload,
  HardDriveDownload,
  Wifi,
  WifiOff,
  Video,
  X,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { CreatorUser } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  offlineCount: number;
  currentTab: 'home' | 'offline';
  onTabChange: (tab: 'home' | 'offline') => void;
  onOpenUpload: () => void;
  creatorSession: CreatorUser | null;
  onLogoutCreator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  offlineCount,
  currentTab,
  onTabChange,
  onOpenUpload,
}) => {
  const isOnline = useOnlineStatus();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Full-Width Search Overlay */}
        {mobileSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 animate-fadeIn sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search videos, tags, categories..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                onSearchChange('');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {/* Brand Logo */}
            <div
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2 cursor-pointer flex-shrink-0 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                    StreamVault
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    PRO
                  </span>
                </div>
                <p className="hidden md:block text-[10px] text-slate-400 font-medium">
                  Video Streaming, Upload & Offline Hub
                </p>
              </div>
            </div>

            {/* Desktop Search Bar (hidden on small mobile) */}
            <div className="hidden sm:block flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search streamable videos, tags, topics..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Navigation & Tools */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Mobile Search Toggle Icon */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="p-1.5 sm:hidden rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                aria-label="Open Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Online/Offline status pill */}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span className="hidden xs:inline">{isOnline ? 'Live' : 'Offline'}</span>
              </div>

              {/* Offline Library Button */}
              <button
                onClick={() => onTabChange(currentTab === 'offline' ? 'home' : 'offline')}
                className={`relative flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  currentTab === 'offline'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="View saved offline videos"
              >
                <HardDriveDownload className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Offline</span>
                {offlineCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-black text-[9px] font-black">
                    {offlineCount}
                  </span>
                )}
              </button>

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Upload Button (hidden on mobile, handled in thumb bottom bar) */}
              <button
                onClick={onOpenUpload}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition"
                title="Upload and share a video"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Category Pills Bar (when on home tab) */}
      {currentTab === 'home' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 border-t border-slate-900">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
