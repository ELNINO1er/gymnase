import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Building2, LogOut, ShieldCheck, LayoutDashboard, Users, ScrollText, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { platformApi } from "../services/api";

const navItems = [
  { path: "/plateforme", label: "Dashboard", icon: LayoutDashboard },
  { path: "/plateforme/salles", label: "Salles", icon: Building2 },
  { path: "/plateforme/admins", label: "Super admins", icon: Users },
  { path: "/plateforme/logs", label: "Journal", icon: ScrollText },
];

interface GymOption {
  id: number;
  name: string;
  status: string;
}

export function PlatformLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [showGymSelector, setShowGymSelector] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    platformApi.gyms().then(({ data }) => {
      setGyms((data.data || []).filter((g: GymOption) => g.status === "ACTIVE"));
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  async function switchToGym(gymId: number) {
    setSwitching(true);
    try {
      const { data } = await platformApi.switchGym(gymId);
      localStorage.setItem("token", data.data.token);
      await refreshUser();
      navigate("/admin");
    } finally {
      setSwitching(false);
      setShowGymSelector(false);
    }
  }

  async function backToPlatform() {
    setSwitching(true);
    try {
      const { data } = await platformApi.switchGym(null);
      localStorage.setItem("token", data.data.token);
      await refreshUser();
      navigate("/plateforme");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/95 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/plateforme" className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <span>Elite <span className="text-amber-400">Platform</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGymSelector(!showGymSelector)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
            >
              <Building2 size={14} />
              <span className="hidden sm:inline">Acceder a une salle</span>
            </button>
            <span className="hidden md:inline text-sm text-zinc-400">{user?.full_name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {showGymSelector && (
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="text-sm font-bold mb-2">Selectionner une salle pour administrer :</div>
            {gyms.length === 0 ? (
              <div className="text-sm text-zinc-400">Aucune salle active.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {gyms.map((gym) => (
                  <button
                    key={gym.id}
                    disabled={switching}
                    onClick={() => switchToGym(gym.id)}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-400/50 transition text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="font-bold text-sm">{gym.name}</div>
                    </div>
                    <ArrowRight size={16} className="text-amber-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/plateforme" && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${active ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
