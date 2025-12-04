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

    // Always check session first - Supabase may have already processed the hash
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session?.user) {
          const { id, email, user_metadata } = data.session.user;
          setUser({
            id,
            email: email || '',
            name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
          });
          // Clear any hash
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          setChecking(false);
          return;
        }

        // No session found - check if we have tokens to process
        const hash = window.location.hash;
        if (hash.includes('access_token') && !hash.includes('type=recovery')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
              .then(({ data: sessionData }) => {
                if (sessionData.session?.user) {
                  const { id, email, user_metadata } = sessionData.session.user;
                  setUser({
                    id,
                    email: email || '',
                    name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
                  });
                }
                window.history.replaceState(null, '', window.location.pathname);
                setChecking(false);
              })
              .catch(() => setChecking(false));
            return;
          }
        }

        // No session and no valid tokens
        setChecking(false);
      })
      .catch(() => setChecking(false));
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
