import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "../services/api";

export type UserRole = "VISITOR" | "MEMBER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "DELETED";

export interface User {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  status: UserStatus;
  gym_id?: number | null;
  is_platform_admin?: boolean;
  member_code: string;
  sport_goal?: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  plan_name: string;
  plan_price: string;
  start_date: string;
  end_date: string;
  status: string;
  duration_days: number;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    full_name: string;
    email?: string;
    phone: string;
    password: string;
    sport_goal?: string;
    plan_id?: number;
  }) => Promise<{ success: boolean; member_code?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isMember: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    subscription: null,
    token: localStorage.getItem("token"),
    loading: true,
  });

  const isAuthenticated = !!state.user && !!state.token;
  const isAdmin = state.user?.role === "ADMIN" || state.user?.role === "SUPER_ADMIN";
  const isPlatformAdmin = !!state.user?.is_platform_admin;
  const isMember = state.user?.role === "MEMBER";

  // Charger le profil au demarrage si token present
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ user: null, subscription: null, token: null, loading: false });
      return;
    }

    try {
      const { data } = await authApi.me();
      setState({
        user: data.data,
        subscription: data.data.subscription || null,
        token,
        loading: false,
      });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setState({ user: null, subscription: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (identifier: string, password: string) => {
    try {
      const { data } = await authApi.login(identifier, password);
      const { token, user, subscription } = data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setState({ user, subscription, token, loading: false });
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.error || "Erreur de connexion";
      return { success: false, error: message };
    }
  };

  const register = async (registerData: {
    full_name: string;
    email?: string;
    phone: string;
    password: string;
    sport_goal?: string;
    plan_id?: number;
  }) => {
    try {
      const { data } = await authApi.register(registerData);
      return { success: true, member_code: data.data.member_code };
    } catch (err: any) {
      const message = err.response?.data?.error || "Erreur lors de l'inscription";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setState({ user: null, subscription: null, token: null, loading: false });
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      refreshUser,
      isAdmin,
      isPlatformAdmin,
      isMember,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
