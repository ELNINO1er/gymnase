import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminRedirect() {
  const { currentGymSlug, isPlatformAdmin, hasGymContext } = useAuth();

  if (isPlatformAdmin && !hasGymContext) {
    return <Navigate to="/plateforme" replace />;
  }

  if (currentGymSlug) {
    return <Navigate to={`/g/${currentGymSlug}/admin`} replace />;
  }

  return <Navigate to="/" replace />;
}
