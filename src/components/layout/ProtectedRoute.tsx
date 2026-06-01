import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Either a single role or an array of roles. The user is allowed if they have
  // any of the listed roles.
  requiredRole: AppRole | AppRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { hasRole, loading } = useAuth();

  if (loading) return null;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const allowed = roles.some((r) => hasRole(r));
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
