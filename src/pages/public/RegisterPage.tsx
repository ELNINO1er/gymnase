import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, UserPlus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { plansApi } from "../../services/api";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function RegisterPage() {
  const { register } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", sport_goal: "", plan_id: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    plansApi.getAll(true).then(({ data }) => setPlans(data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.password.trim()) {
      setError("Nom, telephone et mot de passe sont obligatoires");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    const result = await register({
      full_name: form.full_name,
      email: form.email || undefined,
      phone: form.phone,
      password: form.password,
      sport_goal: form.sport_goal || undefined,
      plan_id: form.plan_id || undefined,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(result.member_code || "");
    } else {
      setError(result.error || "Erreur lors de l'inscription");
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="inline-flex bg-green-500/10 text-green-400 p-3 rounded-full mb-4">
            <Check size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Inscription enregistree !</h2>
          <p className="text-zinc-400 mb-4">
            Votre inscription est en attente de validation par l'administration.
          </p>
          {success && (
            <div className="bg-zinc-950 rounded-xl p-4 mb-5">
              <div className="text-sm text-zinc-400">Votre code membre</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">{success}</div>
              <div className="text-xs text-zinc-500 mt-2">Conservez ce code, il vous servira a vous connecter.</div>
            </div>
          )}
          <Link to="/login" className="inline-flex bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-3 rounded-lg transition">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
            <UserPlus size={28} />
          </div>
          <h1 className="text-2xl font-bold">Inscription</h1>
          <p className="text-zinc-400 text-sm mt-1">Rejoignez Elite Gym</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nom complet *</label>
            <input value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); setError(""); }}
              placeholder="Moussa Diallo"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Telephone *</label>
            <input value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setError(""); }}
              placeholder="+221 77 123 45 67"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email (optionnel)</label>
            <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }}
              placeholder="moussa@email.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Mot de passe *</label>
            <input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
              placeholder="Min 6 caracteres"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Objectif sportif</label>
            <input value={form.sport_goal} onChange={(e) => setForm({ ...form, sport_goal: e.target.value })}
              placeholder="Ex: Musculation, perte de poids..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none" />
          </div>

          {plans.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Choisir un abonnement</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((p) => (
                  <button type="button" key={p.id}
                    onClick={() => setForm({ ...form, plan_id: form.plan_id === p.id ? 0 : p.id })}
                    className={`p-3 rounded-xl border text-left transition text-sm ${
                      form.plan_id === p.id ? "border-amber-400 bg-amber-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-600"
                    }`}>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-amber-400 font-black">{fmt(Number(p.price))}</div>
                    <div className="text-xs text-zinc-500">{p.duration_days}j</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold py-3 rounded-lg transition">
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Deja membre ?{" "}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
