import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const location = useLocation();

  // If there's an access_token in URL, redirect to dashboard - App.tsx will handle it
  if (location.hash.includes('access_token')) {
    window.location.href = '/dashboard' + location.hash;
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
