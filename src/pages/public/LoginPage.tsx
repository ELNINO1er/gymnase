import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function LoginPage({ adminOnly = false }: { adminOnly?: boolean }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      // Redirect based on role — need to re-read from localStorage since state updates async
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isPlatformAdmin = Boolean(user.is_platform_admin);

      const isCoachUser = user.role === "COACH";

      if (adminOnly && !isAdminUser && !isCoachUser) {
        logout();
        setError("Acces reserve a l'administration.");
        return;
      }

      navigate(
        isPlatformAdmin && !user.gym_id ? "/plateforme" :
        isAdminUser ? "/admin" :
        isCoachUser ? "/coach" :
        "/membre"
      );
    } else {
      setError(result.error || "Erreur de connexion");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
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
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
              Connexion client
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-zinc-500 mt-5">
            Pas encore membre ?{" "}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium">
              S'inscrire
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
