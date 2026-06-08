import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, BarChart3, Bell, Building2, Calendar, CreditCard, DoorOpen, Download, FileText, Gift, Home, Layers, LogOut, Mail, MapPin, Receipt, Settings, ShieldCheck, ShoppingBag, Dumbbell, UserCheck, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGymContext } from "../hooks/useGymContext";

const NAV_ITEMS = [
  { path: "", label: "Dashboard", icon: Home },
  { path: "membres", label: "Membres", icon: Users },
  { path: "presences", label: "Presences", icon: DoorOpen },
  { path: "reservations", label: "Reservations", icon: Calendar },
  { path: "paiements", label: "Paiements", icon: CreditCard },
  { path: "abonnements", label: "Abonnements", icon: UserCheck },
  { path: "plans", label: "Plans", icon: Layers },
  { path: "factures", label: "Factures", icon: Receipt },
  { path: "programmes", label: "Programmes", icon: Dumbbell },
  { path: "boutique", label: "Boutique", icon: ShoppingBag },
  { path: "promos", label: "Promos", icon: Gift },
  { path: "risques", label: "Risques", icon: AlertTriangle },
  { path: "messagerie", label: "Messages", icon: Mail },
  { path: "analytics", label: "Stats", icon: BarChart3 },
  { path: "exports", label: "Exports", icon: Download },
  { path: "branches", label: "Salles", icon: MapPin },
  { path: "logs", label: "Logs", icon: FileText },
  { path: "settings", label: "Config", icon: Settings },
  { path: "notifications", label: "Notifs", icon: Bell },
];

export function AdminLayout() {
  const { user, logout, isPlatformAdmin } = useAuth();
  const { leaveGym, activeGymName } = useGymContext();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = `/g/${slug || ""}/admin`;
  const gymDisplayName = activeGymName || user?.gym_name || "Salle";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleBackToPlatform = async () => {
    try {
      await leaveGym();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={basePath} className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <span className="hidden sm:inline">
              <span className="text-amber-400">{gymDisplayName}</span> Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {gymDisplayName && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-200">
                <Building2 size={13} className="text-amber-400" />
                {gymDisplayName}
              </span>
            )}
            {isPlatformAdmin && (
              <button onClick={handleBackToPlatform} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition hidden sm:inline-flex">
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
            const fullPath = item.path ? `${basePath}/${item.path}` : basePath;
            const active = item.path
              ? location.pathname.startsWith(fullPath)
              : location.pathname === basePath;
            return (
              <Link
                key={item.path}
                to={fullPath}
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
