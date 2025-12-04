import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);

  // App.tsx already loaded the session, just check the store
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
