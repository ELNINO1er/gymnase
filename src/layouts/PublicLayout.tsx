import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Dumbbell, LogIn, UserPlus, CreditCard } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";

function extractSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/g\/([a-z0-9-]+)\//);
  return match ? match[1] : null;
}

export function PublicLayout() {
  const { isAuthenticated, isAdmin, isPlatformAdmin, currentGymSlug } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = extractSlugFromPath(location.pathname);
  const [gymName, setGymName] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      authApi.getGymInfo(slug)
        .then(({ data }) => setGymName(data.data?.name || null))
        .catch(() => setGymName(null));
    } else {
      setGymName(null);
    }
  }, [slug]);

  const displayName = gymName || "ELITE GYM";
  const loginPath = slug ? `/g/${slug}/login` : "/login";
  const registerPath = slug ? `/g/${slug}/register` : "/register";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-black text-2xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-2 rounded-lg">
              <Dumbbell size={24} />
            </span>
            {gymName ? (
              <span className="text-amber-400">{gymName}</span>
            ) : (
              <span>
                ELITE <span className="text-amber-400">GYM</span>
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/plans" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <CreditCard size={16} /> <span className="hidden sm:inline">Tarifs</span>
            </Link>
            {isAuthenticated ? (
              <button
                onClick={() => navigate(
                  isPlatformAdmin ? "/plateforme" :
                  isAdmin && currentGymSlug ? `/g/${currentGymSlug}/admin` :
                  "/membre"
                )}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-400 text-zinc-950 transition">
                Mon espace
              </button>
            ) : (
              <>
                <Link to={loginPath} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                  <LogIn size={16} /> <span className="hidden sm:inline">Connexion</span>
                </Link>
                <Link to={registerPath} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-400 text-zinc-950 hover:bg-amber-300 transition">
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
        {displayName} &middot; Salle de sport &middot; Tous droits r&eacute;serv&eacute;s
      </footer>
    </div>
  );
}
