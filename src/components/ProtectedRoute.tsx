import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [checking, setChecking] = useState(!user);

  useEffect(() => {
    if (user) {
      setChecking(false);
      return;
    }

    // Timeout fallback - never hang more than 5 seconds
    const timeout = setTimeout(() => {
      console.log('[ProtectedRoute] Timeout - forcing check complete');
      setChecking(false);
    }, 5000);

    const hash = window.location.hash;
    
    // Clear empty hash
    if (hash === '#') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // OAuth tokens in URL
    if (hash.length > 1 && hash.includes('access_token') && !hash.includes('type=recovery')) {
      console.log('[ProtectedRoute] Processing OAuth token...');
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(async ({ data, error }) => {
            console.log('[ProtectedRoute] setSession result:', error || 'success');
            if (data.session?.user) {
              const { id, email, user_metadata } = data.session.user;
              setUser({
                id,
                email: email || '',
                name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
              });
              window.history.replaceState(null, '', window.location.pathname);
            }
            clearTimeout(timeout);
            setChecking(false);
          })
          .catch((err) => {
            console.error('[ProtectedRoute] setSession error:', err);
            clearTimeout(timeout);
            setChecking(false);
          });
      } else {
        clearTimeout(timeout);
        setChecking(false);
      }
    } else {
      // No tokens - check existing session
      console.log('[ProtectedRoute] Checking existing session...');
      supabase.auth.getSession()
        .then(({ data }) => {
          console.log('[ProtectedRoute] getSession result:', data.session ? 'found' : 'none');
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
            });
          }
          clearTimeout(timeout);
          setChecking(false);
        })
        .catch((err) => {
          console.error('[ProtectedRoute] getSession error:', err);
          clearTimeout(timeout);
          setChecking(false);
        });
    }

    return () => clearTimeout(timeout);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
