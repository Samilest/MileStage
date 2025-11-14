import { useState, useEffect, memo } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const hasActiveChannels = channels.some(
        (channel) => channel.state === 'joined'
      );
      setIsConnected(hasActiveChannels);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isConnected ? (
        <div className="bg-white border-2 border-green-500 text-green-700 px-3 py-2 rounded-full flex items-center gap-2 text-sm shadow-md font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Live Updates Active</span>
          <Wifi className="w-4 h-4 sm:hidden" />
        </div>
      ) : (
        <div className="bg-white border-2 border-yellow-500 text-yellow-700 px-3 py-2 rounded-full flex items-center gap-2 text-sm shadow-md font-medium">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Reconnecting...</span>
          <WifiOff className="w-4 h-4 sm:hidden" />
        </div>
      )}
    </>
  );
}

export default memo(RealtimeStatus);
