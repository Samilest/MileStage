import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { retryOperation } from '../lib/errorHandling';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await retryOperation(
        async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          return session;
        },
        2,
        'auth check'
      );

      if (session?.user) {
        setAuthenticated(true);
        if (!user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          });
        }
      } else {
        setAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setAuthenticated(false);

      if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        toast.error('Connection error. Please check your internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ message: 'Please sign in to continue' }} />;
  }

  return <>{children}</>;
}
