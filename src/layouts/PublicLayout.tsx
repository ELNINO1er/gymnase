import { Link, Outlet, useNavigate } from "react-router-dom";
import { Dumbbell, LogIn, UserPlus, CreditCard } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function PublicLayout() {
  const { isAuthenticated, isAdmin, isMember } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-black text-2xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-2 rounded-lg">
              <Dumbbell size={24} />
            </span>
            <span>
              ELITE <span className="text-amber-400">GYM</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/plans" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <CreditCard size={16} /> <span className="hidden sm:inline">Tarifs</span>
            </Link>
            {isAuthenticated ? (
              <button
                onClick={() => navigate(isAdmin ? "/admin" : "/membre")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-400 text-zinc-950 transition">
                Mon espace
              </button>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                  <LogIn size={16} /> <span className="hidden sm:inline">Connexion</span>
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-400 text-zinc-950 hover:bg-amber-300 transition">
                  <UserPlus size={16} /> <span className="hidden sm:inline">Inscription</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800 mt-12 py-6 text-center text-zinc-500 text-sm">
        Elite Gym &middot; Salle de sport &middot; Tous droits r&eacute;serv&eacute;s
      </footer>
    </div>
  );
}
