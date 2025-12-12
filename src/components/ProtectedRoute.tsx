import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';

// Helper to get session from localStorage
function getSessionFromStorage() {
  try {
    const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
    const sessionStr = localStorage.getItem(storageKey);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.user && session?.access_token) {
        // Check if token is expired
        const expiresAt = session.expires_at;
        if (expiresAt && Date.now() / 1000 < expiresAt) {
          return session;
        }
      }
    }
  } catch (e) {
    console.error('[ProtectedRoute] Error reading session from storage:', e);
  }
  return null;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If user already in store, we're good
    if (user) {
      setChecking(false);
      return;
    }

    // Check localStorage for session (this never hangs)
    const storedSession = getSessionFromStorage();
    if (storedSession?.user) {
      console.log('[ProtectedRoute] Found session in localStorage');
      setUser({
        id: storedSession.user.id,
        email: storedSession.user.email || '',
        name: storedSession.user.user_metadata?.name || storedSession.user.email?.split('@')[0] || 'User',
      });
      setChecking(false);
      return;
    }

    // Handle OAuth callback - check for access_token in hash
    const hash = location.hash;
    if (hash.includes('access_token') && !hash.includes('type=recovery')) {
      console.log('[ProtectedRoute] OAuth callback detected');
      
      // Parse tokens from hash manually (don't use setSession which hangs)
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const expiresAt = params.get('expires_at');

      if (accessToken) {
        try {
          // Decode user from JWT
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const userId = payload.sub;
          const userEmail = payload.email || '';
          const userName = payload.user_metadata?.name || 
                          payload.user_metadata?.full_name || 
                          userEmail?.split('@')[0] || 'User';

          // Store session manually
          const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
          localStorage.setItem(storageKey, JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: parseInt(expiresIn || '3600'),
            expires_at: parseInt(expiresAt || String(Math.floor(Date.now() / 1000) + 3600)),
            token_type: 'bearer',
            user: {
              id: userId,
              email: userEmail,
              user_metadata: payload.user_metadata || {},
            },
          }));

          // Create user profile if needed (use fetch)
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${accessToken}`,
            },
          }).then(res => res.json()).then(data => {
            if (!data || data.length === 0) {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  id: userId,
                  email: userEmail,
                  name: userName,
                  subscription_tier: 'free',
                }),
              });
            }
          });

          setUser({ id: userId, email: userEmail, name: userName });
          
          // Clear hash
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {
          console.error('[ProtectedRoute] Error processing OAuth:', e);
        }
      }
      setChecking(false);
      return;
    }

    // No session found anywhere
    console.log('[ProtectedRoute] No session found');
    setChecking(false);
  }, [user, setUser, location.hash]);

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
