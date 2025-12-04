import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Clear hash if empty
    if (window.location.hash === '#') {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Get session - Supabase auto-processes hash with detectSessionInUrl: true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        });
        // Clear hash after processing
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      setChecking(false);
    });
  }, [setUser]);

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
