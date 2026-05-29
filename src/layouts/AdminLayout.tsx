import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, Calendar, CreditCard, Home, LogOut, ShieldCheck, Users, Layers } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: Home },
  { path: "/admin/membres", label: "Membres", icon: Users },
  { path: "/admin/reservations", label: "Reservations", icon: Calendar },
  { path: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { path: "/admin/plans", label: "Plans", icon: Layers },
  { path: "/admin/notifications", label: "Notifications", icon: Bell },
];

export function AdminLayout() {
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
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <span>
              Elite <span className="text-amber-400">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/membre" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
              Vue membre
            </Link>
            <span className="text-sm text-zinc-400 hidden sm:inline">
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
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  active ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}>
                <item.icon size={16} />
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
