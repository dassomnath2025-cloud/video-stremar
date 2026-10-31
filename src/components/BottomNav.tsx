import React from 'react';
import { Home, Compass, HardDriveDownload, PlusCircle } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'offline';
  onTabChange: (tab: 'home' | 'offline') => void;
  onOpenUpload: () => void;
  offlineCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenUpload,
  offlineCount,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 md:hidden">
      <div className="grid grid-cols-3 items-center">
        {/* Home Feed */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            currentTab === 'home' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Stream</span>
        </button>

        {/* Creator Upload Action (Center Accent) */}
        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center justify-center py-1 text-slate-300 hover:text-white"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 -mt-3 border-2 border-slate-950">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Upload</span>
        </button>

        {/* Offline Library */}
        <button
          onClick={() => onTabChange('offline')}
          className={`relative flex flex-col items-center justify-center py-1 transition ${
            currentTab === 'offline' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <HardDriveDownload className="w-5 h-5 mb-0.5" />
            {offlineCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-black text-[9px] font-black">
                {offlineCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Offline</span>
        </button>
      </div>
    </nav>
  );
};
