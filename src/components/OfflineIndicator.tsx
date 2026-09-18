import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-xl border border-slate-700 animate-in slide-in-from-bottom-5">
      <WifiOff className="w-4 h-4 text-rose-500" />
      <span>You are offline. Reconnecting...</span>
    </div>
  );
};
