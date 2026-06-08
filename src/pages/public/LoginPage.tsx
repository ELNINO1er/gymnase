import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LogIn, ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../services/api";

interface GymInfo {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
}

export function LoginPage({ adminOnly = false }: { adminOnly?: boolean }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);

  useEffect(() => {
    if (slug) {
      authApi.getGymInfo(slug).then(({ data }) => setGymInfo(data.data)).catch(() => setGymInfo(null));
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(identifier.trim(), password, slug || undefined);
    setLoading(false);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isPlatformAdmin = Boolean(user.is_platform_admin);
      const isCoachUser = user.role === "COACH";

      if (adminOnly && !isAdminUser && !isCoachUser) {
        logout();
        setError("Acces reserve a l'administration.");
        return;
      }

      const gymSlug = user.active_gym_slug || user.gym_slug || slug;
      navigate(
        isPlatformAdmin && !gymSlug ? "/plateforme" :
        isAdminUser && gymSlug ? `/g/${gymSlug}/admin` :
        isAdminUser ? "/plateforme" :
        isCoachUser ? "/coach" :
        "/membre"
      );
    } else {
      setError(result.error || "Erreur de connexion");
    }
  };

  const gymName = gymInfo?.name || null;
  const registerLink = slug ? `/g/${slug}/register` : "/register";
  const loginLink = slug ? `/g/${slug}/login` : "/login";
  const adminLoginLink = slug ? `/g/${slug}/admin/login` : "/admin/login";

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        {gymName && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-zinc-400">
            <Building2 size={16} className="text-amber-400" />
            <span className="font-bold text-zinc-200">{gymName}</span>
          </div>
        )}
        <div className="text-center mb-6">
          <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
            {adminOnly ? <ShieldCheck size={28} /> : <LogIn size={28} />}
          </div>
          <h1 className="text-2xl font-bold">{adminOnly ? "Connexion admin" : "Connexion membre"}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {adminOnly ? "Acces reserve a l'administration" : "Email, telephone ou code membre"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Identifiant</label>
            <input
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              placeholder={adminOnly ? "Email administrateur" : "Email, telephone ou code membre"}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Votre mot de passe"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold py-3 rounded-lg transition">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {adminOnly ? (
          <p className="text-center text-sm text-zinc-500 mt-5">
            Espace membre ?{" "}
            <Link to={loginLink} className="text-amber-400 hover:text-amber-300 font-medium">
              Connexion client
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-zinc-500 mt-5">
            Pas encore membre ?{" "}
            <Link to={registerLink} className="text-amber-400 hover:text-amber-300 font-medium">
              S'inscrire
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
