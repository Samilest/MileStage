import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const hash = location.hash;
    
    // Handle OAuth callback
    if (hash.includes('access_token') && !hash.includes('type=recovery')) {
      setProcessing(true);
      
      // Parse tokens from hash
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session manually
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(async ({ data: { session }, error }) => {
          if (error) {
            console.error('Session error:', error);
            setProcessing(false);
            return;
          }
          
          if (session?.user) {
            const userId = session.user.id;
            const userEmail = session.user.email || '';
            const userName = session.user.user_metadata?.name || 
                            session.user.user_metadata?.full_name || 
                            session.user.email?.split('@')[0] || 'User';

            // Ensure profile exists
            const { data: existing } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle();

            if (!existing) {
              await supabase.from('user_profiles').insert({
                id: userId,
                email: userEmail,
                name: userName,
                subscription_tier: 'free',
              });
            }

            setUser({ id: userId, email: userEmail, name: userName });
            
            // Redirect to dashboard
            window.location.href = '/dashboard';
          } else {
            setProcessing(false);
          }
        });
      } else {
        setProcessing(false);
      }
    }
  }, []);

  // Show loading while processing OAuth
  if (processing || location.hash.includes('access_token')) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Signing in...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
