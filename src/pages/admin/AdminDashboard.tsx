import { useEffect, useState } from "react";
import { dashboardApi } from "../../services/api";
import { Users, Calendar, CreditCard, TrendingUp, Bell, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.summary().then(({ data }) => {
      setSummary(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement du tableau de bord...</div>;
  if (!summary) return <div className="text-center py-10 text-red-400">Erreur de chargement</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-zinc-400 text-sm">Tableau de bord</div>
          <h1 className="text-2xl font-bold">Administration Elite Gym</h1>
        </div>
        {summary.unread_notifications > 0 && (
          <Link to="/admin/notifications" className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/40 text-amber-400 px-3 py-2 rounded-lg text-sm font-medium">
            <Bell size={16} /> {summary.unread_notifications} notification{summary.unread_notifications > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Stats principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} titre="Membres actifs" valeur={String(summary.members.active)} color="text-green-400" />
        <StatCard icon={Clock} titre="En attente" valeur={String(summary.members.pending)} color="text-amber-400" />
        <StatCard icon={Calendar} titre="Reservations aujourd'hui" valeur={String(summary.reservations_today.total)} color="text-blue-400" />
        <StatCard icon={TrendingUp} titre="Revenu du jour" valeur={fmt(summary.revenue.today)} color="text-green-400" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CreditCard} titre="Revenu du mois" valeur={fmt(summary.revenue.month)} color="text-amber-400" />
        <StatCard icon={CreditCard} titre="Paiements en attente" valeur={fmt(summary.revenue.pending)} color="text-red-400" />
        <StatCard icon={Users} titre="Nouveaux aujourd'hui" valeur={String(summary.members.new_today)} color="text-blue-400" />
        <StatCard icon={Users} titre="Abonnements actifs" valeur={String(summary.subscriptions.active)} color="text-green-400" />
      </div>

      {/* Liens rapides */}
      <div className="grid sm:grid-cols-3 gap-4">
        {summary.members.pending > 0 && (
          <Link to="/admin/membres" className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5 hover:bg-amber-400/20 transition">
            <div className="text-amber-400 font-bold text-lg">{summary.members.pending}</div>
            <div className="text-sm text-zinc-300">Inscription(s) a valider</div>
          </Link>
        )}
        {summary.revenue.pending > 0 && (
          <Link to="/admin/paiements" className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 hover:bg-red-500/20 transition">
            <div className="text-red-400 font-bold text-lg">{fmt(summary.revenue.pending)}</div>
            <div className="text-sm text-zinc-300">Paiement(s) en attente</div>
          </Link>
        )}
        {summary.subscriptions.expired_to_update > 0 && (
          <Link to="/admin/membres" className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 hover:bg-orange-500/20 transition">
            <div className="text-orange-400 font-bold text-lg">{summary.subscriptions.expired_to_update}</div>
            <div className="text-sm text-zinc-300">Abonnement(s) expire(s)</div>
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, titre, valeur, color }: { icon: any; titre: string; valeur: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        <span className="text-sm text-zinc-400">{titre}</span>
      </div>
      <div className={`text-xl font-black ${color}`}>{valeur}</div>
    </div>
  );
}
