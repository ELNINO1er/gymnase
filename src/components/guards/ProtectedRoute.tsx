import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "../../contexts/AuthContext";
import { Dumbbell } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  loginPath?: string;
  platformOnly?: boolean;
  requireGym?: boolean;
}

export function ProtectedRoute({ children, roles, loginPath = "/login", platformOnly = false, requireGym = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse flex items-center gap-2">
          <Dumbbell className="animate-bounce" size={24} /> Chargement...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (platformOnly && !user?.is_platform_admin) {
    return <Navigate to="/" replace />;
  }

  if (requireGym && user?.is_platform_admin && !user?.gym_id) {
    return <Navigate to="/plateforme" replace />;
  }

  return <>{children}</>;
}
