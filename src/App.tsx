import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoCard } from './components/VideoCard';
import { VideoDetails } from './components/VideoDetails';
import { OfflineLibrary } from './components/OfflineLibrary';
import { UploadModal } from './components/UploadModal';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VideoItem, OfflineVideo, CreatorUser } from './types';
import { getOfflineVideos } from './lib/offlineStorage';
import {
  Film,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  Eye,
  Loader2,
  Tv,
  CheckCircle,
} from 'lucide-react';

const CATEGORIES = ['All', 'Animation', 'Sci-Fi', 'Nature', 'Space', 'Technology', 'Cinema', 'Tutorial'];

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | OfflineVideo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes' | 'downloads'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  // App tabs & Modals
  const [currentTab, setCurrentTab] = useState<'home' | 'offline'>('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [publishedToast, setPublishedToast] = useState<{ title: string; visible: boolean } | null>(null);

  // Creator Session
  const [creatorSession, setCreatorSession] = useState<CreatorUser | null>(null);

  // Check stored creator session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('streamvault_creator_user');
      if (stored) {
        setCreatorSession(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse creator session:', e);
    }
  }, []);

  // Update offline videos count
  const refreshOfflineCount = useCallback(async () => {
    try {
      const list = await getOfflineVideos();
      setOfflineCount(list.length);
    } catch {
      setOfflineCount(0);
    }
  }, []);

  useEffect(() => {
    refreshOfflineCount();
  }, [refreshOfflineCount]);

  // Fetch videos from backend API
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const res = await fetch(`/api/videos?${params.toString()}`);
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
        // If no video is selected yet, select the first featured video by default for streaming
        if (!currentVideo && data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch videos from server:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, currentVideo]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Video Actions
  const handleSelectVideo = (video: VideoItem) => {
    setCurrentVideo(video);
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayOfflineVideo = (video: OfflineVideo) => {
    setCurrentVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (v: VideoItem | OfflineVideo) => {
    const cleanTitle = v.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const a = document.createElement('a');
    a.href = (v as OfflineVideo).blobUrl || `/api/videos/${v.id}/download`;
    a.download = `${cleanTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleVideoPublished = (newVideo: VideoItem) => {
    setVideos((prev) => [newVideo, ...prev]);
    setCurrentVideo(newVideo);
    setCurrentTab('home');
    setPublishedToast({ title: newVideo.title, visible: true });
    setTimeout(() => setPublishedToast(null), 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = async (id: string) => {
    const token = localStorage.getItem('streamvault_creator_token') || 'creator-session-active';
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-creator-passkey': 'creator2025',
        },
      });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        if (currentVideo?.id === id) {
          const remaining = videos.filter((v) => v.id !== id);
          setCurrentVideo(remaining.length > 0 ? remaining[0] : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleLogoutCreator = () => {
    localStorage.removeItem('streamvault_creator_token');
    localStorage.removeItem('streamvault_creator_user');
    setCreatorSession(null);
  };

  const isCurrentVideoOffline = !!(currentVideo as OfflineVideo)?.blobUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-12">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={CATEGORIES}
        offlineCount={offlineCount}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        creatorSession={creatorSession}
        onLogoutCreator={handleLogoutCreator}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-0 sm:px-6 lg:px-8 py-0 sm:py-6">
        {currentTab === 'offline' ? (
          /* Offline Video Library Shelf */
          <div className="px-3.5 sm:px-0 py-4 sm:py-0">
            <OfflineLibrary
              onPlayVideo={handlePlayOfflineVideo}
              onClose={() => setCurrentTab('home')}
            />
          </div>
        ) : (
          /* Home Streaming & Video Browser View */
          <div className="space-y-6 sm:space-y-8">
            {/* Active Video Player Stage */}
            {currentVideo ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                {/* Main Player & Details Column (8 cols on desktop) */}
                <div className="lg:col-span-8 space-y-4 sm:space-y-5">
                  <VideoPlayer
                    key={currentVideo.id}
                    video={currentVideo}
                    isOfflineMode={isCurrentVideoOffline}
                    onDownloadRequested={handleDownload}
                    onSavedOfflineSuccess={() => refreshOfflineCount()}
                  />

                  <div className="px-3.5 sm:px-0">
                    <VideoDetails
                      video={currentVideo}
                      isOfflineMode={isCurrentVideoOffline}
                      creatorSession={creatorSession}
                      onDeleteVideo={handleDeleteVideo}
                      onDownload={handleDownload}
                      onSavedOfflineSuccess={() => refreshOfflineCount()}
                    />
                  </div>
                </div>

                {/* Up Next / Recommended Sidebar (4 cols on desktop) */}
                <div className="lg:col-span-4 space-y-4 px-3.5 sm:px-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      <span>Up Next / More Videos</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {videos.length} clips
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                    {videos
                      .filter((v) => v.id !== currentVideo.id)
                      .map((video) => (
                        <div
                          key={video.id}
                          onClick={() => handleSelectVideo(video)}
                          className="group flex gap-3 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition"
                        >
                          <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-mono text-white">
                              {Math.floor(video.duration / 60)}:
                              {(video.duration % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-indigo-300 line-clamp-2 leading-tight">
                              {video.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <span>{video.category}</span>
                              <span>•</span>
                              <span>{video.views.toLocaleString()} views</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Video Catalog Filter & Grid Section */}
            <div className="pt-6 border-t border-slate-800/80 space-y-5 sm:space-y-6 px-3.5 sm:px-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    <span>Browse Video Catalog</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    High definition streams with instant chunked seeking and offline caching.
                  </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar py-0.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 flex-shrink-0">Sort by:</span>
                  <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex-shrink-0">
                    <button
                      onClick={() => setSortBy('recent')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${
                        sortBy === 'recent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => setSortBy('views')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${
                        sortBy === 'views' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Popular
                    </button>
                    <button
                      onClick={() => setSortBy('downloads')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${
                        sortBy === 'downloads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Downloads
                    </button>
                  </div>
                </div>
              </div>

              {/* Videos Grid */}
              {isLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                  <p className="text-sm">Loading video streams...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
                  <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-base font-semibold text-white">No videos found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching for another keyword or change your category filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelect={handleSelectVideo}
                      onDownload={handleDownload}
                      onSavedOffline={() => refreshOfflineCount()}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Video Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onVideoPublished={handleVideoPublished}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        offlineCount={offlineCount}
      />

      {/* Floating Offline Indicator */}
      <OfflineIndicator onOpenOfflineLibrary={() => setCurrentTab('offline')} />

      {/* Instant Live Video Publish Toast */}
      {publishedToast?.visible && (
        <div className="fixed top-18 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl border border-emerald-400/40 backdrop-blur-md animate-bounce-subtle">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Automatically Live Now!</span>
            </div>
            <div className="text-xs font-semibold text-white max-w-[240px] truncate">
              {publishedToast.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
