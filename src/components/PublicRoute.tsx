import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const user = useStore((state) => state.user);
  const location = useLocation();

  // Allow access if there's an OAuth callback (access_token in hash)
  if (location.hash.includes('access_token') || location.hash.includes('type=recovery')) {
    return <>{children}</>;
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
