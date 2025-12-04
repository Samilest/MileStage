import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
