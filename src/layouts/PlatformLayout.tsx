import { Link, Outlet, useNavigate } from "react-router-dom";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
            <span className="hidden md:inline text-sm text-zinc-400">{user?.full_name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <Link to="/plateforme" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold">
            <Building2 size={14} />
            Salles et super admins
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
