import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, HardDriveDownload } from 'lucide-react';

interface Props {
  onOpenOfflineLibrary?: () => void;
}

export const OfflineIndicator: React.FC<Props> = ({ onOpenOfflineLibrary }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-amber-600/95 border border-amber-400/30 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-2xl animate-bounce-subtle">
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-4 h-4 text-amber-200" />
        <span>You are offline</span>
      </div>
      {onOpenOfflineLibrary && (
        <button
          onClick={onOpenOfflineLibrary}
          className="flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-semibold text-white transition active:scale-95"
        >
          <HardDriveDownload className="w-3.5 h-3.5" />
          <span>Open Saved Videos</span>
        </button>
      )}
    </div>
  );
};
