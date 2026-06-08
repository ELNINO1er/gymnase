import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { platformApi } from "../services/api";

export function useGymContext() {
  const { user, isPlatformAdmin, refreshUser, currentGymSlug } = useAuth();
  const navigate = useNavigate();

  const enterGym = async (slug: string) => {
    const { data } = await platformApi.switchGym(slug);
    localStorage.setItem("token", data.data.token);
    await refreshUser();
    navigate(`/g/${slug}/admin`);
  };

  const leaveGym = async () => {
    const { data } = await platformApi.leaveGym();
    localStorage.setItem("token", data.data.token);
    await refreshUser();
    navigate("/plateforme");
  };

  // Build admin path with correct slug prefix
  const adminPath = (subPath?: string) => {
    if (!currentGymSlug) return "/plateforme";
    return `/g/${currentGymSlug}/admin${subPath ? `/${subPath}` : ""}`;
  };

  return {
    enterGym,
    leaveGym,
    adminPath,
    currentGymSlug,
    isPlatformAdmin,
    activeGymName: user?.active_gym_name || user?.gym_name || null,
  };
}
