import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, DollarSign, Activity, ChevronRight } from "lucide-react";
import { platformApi } from "../../services/api";

interface Summary {
  gyms: { total: number; pending: number; active: number; suspended: number };
  users: number;
}

interface GymRevenue {
  id: number;
  name: string;
  slug: string;
  status: string;
  total_revenue: number;
  month_revenue: number;
  members_count: number;
}

export function PlatformDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenue, setRevenue] = useState<{ gyms: GymRevenue[]; totals: { total: number; month: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([platformApi.summary(), platformApi.revenue()]);
        setSummary(s.data.data);
        setRevenue(r.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-zinc-400 animate-pulse p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Vue d'ensemble</p>
        <h1 className="text-3xl font-black tracking-tight">Tableau de bord plateforme</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total salles" value={summary?.gyms.total ?? 0} icon={<Building2 size={20} />} />
        <StatCard label="Salles actives" value={summary?.gyms.active ?? 0} icon={<Activity size={20} />} color="text-emerald-400" />
        <StatCard label="En attente" value={summary?.gyms.pending ?? 0} icon={<Building2 size={20} />} color="text-amber-400" />
        <StatCard label="Utilisateurs" value={summary?.users ?? 0} icon={<Users size={20} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-lg font-bold mb-1">Revenus globaux</div>
          <div className="text-3xl font-black text-amber-400">{(revenue?.totals.total ?? 0).toLocaleString()} FCFA</div>
          <div className="text-sm text-zinc-400 mt-1">Ce mois : {(revenue?.totals.month ?? 0).toLocaleString()} FCFA</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-lg font-bold mb-1">Salles suspendues</div>
          <div className="text-3xl font-black text-red-400">{summary?.gyms.suspended ?? 0}</div>
          <div className="text-sm text-zinc-400 mt-1">Salles temporairement desactivees</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-bold">Revenus par salle</span>
          <Link to="/plateforme/salles" className="text-sm text-amber-400 hover:underline flex items-center gap-1">
            Voir toutes <ChevronRight size={14} />
          </Link>
        </div>
        {revenue?.gyms.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucune salle.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {revenue?.gyms.map((gym) => (
              <Link key={gym.id} to={`/plateforme/salles/${gym.id}`} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition">
                <div>
                  <div className="font-bold">{gym.name}</div>
                  <div className="text-sm text-zinc-400">{gym.members_count} membres</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400">{Number(gym.total_revenue).toLocaleString()} FCFA</div>
                  <div className="text-xs text-zinc-500">Ce mois : {Number(gym.month_revenue).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-white" }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">{icon} {label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}
