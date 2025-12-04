import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hash = location.hash;

    // OAuth callback - set session from tokens
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(async ({ data: { session } }) => {
            if (session?.user) {
              const { id, email, user_metadata } = session.user;
              
              // Create profile if needed
              const { data: existing } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', id)
                .maybeSingle();

              if (!existing) {
                await supabase.from('user_profiles').insert({
                  id,
                  email: email || '',
                  name: user_metadata?.name || email?.split('@')[0] || 'User',
                  subscription_tier: 'free',
                });
              }

              setUser({
                id,
                email: email || '',
                name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
              });

              // Clear hash
              window.history.replaceState(null, '', '/dashboard');
            }
            setChecking(false);
          });
        return;
      }
    }

    // No OAuth - just check if logged in
    if (user) {
      setChecking(false);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          });
        }
        setChecking(false);
      });
    }
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
