import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const user = useStore((state) => state.user);
  const location = useLocation();

  // Don't redirect if there's an OAuth callback in progress (hash contains tokens)
  const hasAuthTokens = location.hash.includes('access_token') || 
                        location.hash.includes('type=recovery') ||
                        location.hash.includes('error=');

  if (hasAuthTokens) {
    console.log('[PublicRoute] Auth tokens detected in hash, allowing access');
    // Return children and let App.tsx handle the token
    return <>{children}</>;
  }

  // If user is logged in and no auth tokens, redirect to dashboard
  if (user) {
    console.log('[PublicRoute] User logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
