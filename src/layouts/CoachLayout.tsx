import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Dumbbell, LayoutDashboard, Calendar, Users, ClipboardList } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { path: "/coach", label: "Dashboard", icon: LayoutDashboard },
  { path: "/coach/seances", label: "Mes seances", icon: Calendar },
  { path: "/coach/membres", label: "Mes membres", icon: Users },
  { path: "/coach/programmes", label: "Programmes", icon: ClipboardList },
];

export function CoachLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/95 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/coach" className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
              <Dumbbell size={20} />
            </span>
            <span>Elite <span className="text-amber-400">Coach</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-zinc-400">{user?.full_name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
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
