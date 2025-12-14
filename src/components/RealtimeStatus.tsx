import { useState, useEffect, memo } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      try {
        // Check if we can reach Supabase
        const { error } = await supabase
          .from('projects')
          .select('id')
          .limit(1)
          .single();
        
        // If we get data OR a "no rows" error, connection is good
        // Only set disconnected if we get a network error
        if (mounted) {
          if (error && (error.message?.includes('fetch') || error.message?.includes('network'))) {
            setIsConnected(false);
          } else {
            setIsConnected(true);
          }
        }
      } catch (err) {
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    // Check immediately
    checkConnection();
    
    // Then check every 10 seconds (less aggressive than 3 seconds)
    const interval = setInterval(checkConnection, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {isConnected ? (
        <div className="bg-white border-2 border-green-500 text-green-700 px-3 py-2 rounded-full flex items-center gap-2 text-sm shadow-md font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Connected</span>
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
