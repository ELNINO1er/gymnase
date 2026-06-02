import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Award, Calendar, CreditCard, Dumbbell, FileText, Gift, Home, LogOut, Mail, QrCode, TrendingUp, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { path: "/membre", label: "Accueil", icon: Home },
  { path: "/membre/qrcode", label: "QR Code", icon: QrCode },
  { path: "/membre/reservations", label: "Reservations", icon: Calendar },
  { path: "/membre/paiements", label: "Paiements", icon: CreditCard },
  { path: "/membre/programmes", label: "Programmes", icon: Dumbbell },
  { path: "/membre/progression", label: "Progression", icon: TrendingUp },
  { path: "/membre/badges", label: "Badges", icon: Award },
  { path: "/membre/parrainage", label: "Parrainage", icon: Gift },
  { path: "/membre/messages", label: "Messages", icon: Mail },
  { path: "/membre/factures", label: "Factures", icon: FileText },
  { path: "/membre/profil", label: "Profil", icon: User },
];

export function MemberLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/membre" className="flex items-center gap-3 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <Dumbbell size={20} />
            </span>
            <span className="hidden sm:inline">
              ELITE <span className="text-amber-400">GYM</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 hidden md:inline">
              {user?.full_name}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-nav tabs — scrollable horizontalement */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  active ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}>
                <item.icon size={15} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
