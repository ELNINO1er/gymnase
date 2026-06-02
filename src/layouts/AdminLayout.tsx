import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, BarChart3, Bell, Calendar, CreditCard, DoorOpen, Download, FileText, Gift, Home, Layers, LogOut, Mail, MapPin, Receipt, Settings, ShieldCheck, ShoppingBag, Dumbbell, UserCheck, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { platformApi } from "../services/api";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: Home },
  { path: "/admin/membres", label: "Membres", icon: Users },
  { path: "/admin/presences", label: "Presences", icon: DoorOpen },
  { path: "/admin/reservations", label: "Reservations", icon: Calendar },
  { path: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { path: "/admin/abonnements", label: "Abonnements", icon: UserCheck },
  { path: "/admin/plans", label: "Plans", icon: Layers },
  { path: "/admin/factures", label: "Factures", icon: Receipt },
  { path: "/admin/programmes", label: "Programmes", icon: Dumbbell },
  { path: "/admin/boutique", label: "Boutique", icon: ShoppingBag },
  { path: "/admin/promos", label: "Promos", icon: Gift },
  { path: "/admin/risques", label: "Risques", icon: AlertTriangle },
  { path: "/admin/messagerie", label: "Messages", icon: Mail },
  { path: "/admin/analytics", label: "Stats", icon: BarChart3 },
  { path: "/admin/exports", label: "Exports", icon: Download },
  { path: "/admin/branches", label: "Salles", icon: MapPin },
  { path: "/admin/logs", label: "Logs", icon: FileText },
  { path: "/admin/settings", label: "Config", icon: Settings },
  { path: "/admin/notifications", label: "Notifs", icon: Bell },
];

export function AdminLayout() {
  const { user, logout, isPlatformAdmin, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const backToPlatform = async () => {
    try {
      const { data } = await platformApi.switchGym(null);
      localStorage.setItem("token", data.data.token);
      await refreshUser();
      navigate("/plateforme");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <span className="hidden sm:inline">
              Elite <span className="text-amber-400">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isPlatformAdmin && (
              <button onClick={backToPlatform} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition hidden sm:inline-flex">
                <ArrowLeft size={12} /> Plateforme
              </button>
            )}
            <Link to="/membre" className="text-xs text-zinc-500 hover:text-zinc-300 transition hidden sm:inline">
              Vue membre
            </Link>
            <span className="text-sm text-zinc-400 hidden md:inline">
              {user?.full_name}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-nav tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  active ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}>
                <item.icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
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
