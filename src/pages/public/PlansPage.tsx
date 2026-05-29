import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { plansApi } from "../../services/api";
import { Check } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plansApi.getAll(true).then(({ data }) => {
      setPlans(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-400">Chargement des tarifs...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">Nos tarifs</h1>
      <p className="text-zinc-400 text-center mb-8">Choisissez la formule qui vous convient</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
            <div className="mb-1">
              <span className="text-3xl font-black text-amber-400">{fmt(Number(plan.price))}</span>
            </div>
            <div className="text-sm text-zinc-500 mb-5">{plan.duration_days} jour{plan.duration_days > 1 ? "s" : ""}</div>
            <div className="mt-auto">
              <Link to="/register" className="block text-center bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition">
                Choisir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
