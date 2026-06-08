import { useEffect, useState } from "react";
import { dashboardApi, attendanceApi } from "../../services/api";
import { Users, Calendar, CreditCard, TrendingUp, Bell, Clock, AlertTriangle, UserCheck, DoorOpen } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function AdminDashboard() {
  const { slug } = useParams();
  const { user } = useAuth();
  const base = `/g/${slug}/admin`;
  const gymName = user?.active_gym_name || user?.gym_name || "la salle";
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [inGym, setInGym] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.summary().catch(() => ({ data: { data: null } })),
      dashboardApi.alerts().catch(() => ({ data: { data: null } })),
      attendanceApi.getInGym().catch(() => ({ data: { data: { count: 0 } } })),
    ]).then(([sumRes, alertRes, gymRes]) => {
      setSummary(sumRes.data.data);
      setAlerts(alertRes.data.data);
      setInGym(gymRes.data.data?.count || 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement du tableau de bord...</div>;
  if (!summary) return <div className="text-center py-10 text-red-400">Erreur de chargement</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-zinc-400 text-sm">Tableau de bord</div>
          <h1 className="text-2xl font-bold">Administration {gymName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {summary.unread_notifications > 0 && (
            <Link to={`${base}/notifications`} className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/40 text-amber-400 px-3 py-2 rounded-lg text-sm font-medium">
              <Bell size={16} /> {summary.unread_notifications}
            </Link>
          )}
          <Link to={`${base}/presences`} className="flex items-center gap-2 bg-green-500/10 border border-green-500/40 text-green-400 px-3 py-2 rounded-lg text-sm font-medium">
            <DoorOpen size={16} /> {inGym} en salle
          </Link>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} titre="Membres actifs" valeur={String(summary.members.active)} color="text-green-400" />
        <StatCard icon={Clock} titre="En attente" valeur={String(summary.members.pending)} color="text-amber-400" />
        <StatCard icon={Calendar} titre="Reservations du jour" valeur={String(summary.reservations_today.total)} color="text-blue-400" />
        <StatCard icon={DoorOpen} titre="En salle maintenant" valeur={String(inGym)} color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={TrendingUp} titre="Revenu du jour" valeur={fmt(summary.revenue.today)} color="text-green-400" />
        <StatCard icon={CreditCard} titre="Revenu du mois" valeur={fmt(summary.revenue.month)} color="text-amber-400" />
        <StatCard icon={CreditCard} titre="Paiements en attente" valeur={fmt(summary.revenue.pending)} color="text-red-400" />
        <StatCard icon={UserCheck} titre="Abonnements actifs" valeur={String(summary.subscriptions.active)} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users} titre="Nouveaux aujourd'hui" valeur={String(summary.members.new_today)} color="text-blue-400" />
        <StatCard icon={Users} titre="Suspendus" valeur={String(summary.members.suspended)} color="text-orange-400" />
        <StatCard icon={Users} titre="Expires" valeur={String(summary.members.expired)} color="text-red-400" />
        <StatCard icon={Users} titre="Total membres" valeur={String(summary.members.total)} color="text-zinc-300" />
      </div>

      {/* Alertes intelligentes */}
      {alerts && alerts.alerts && alerts.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-400" /> Alertes</h2>
          <div className="space-y-3">
            {alerts.alerts.map((alert: any, i: number) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Liens rapides */}
      <h2 className="font-bold text-lg mb-3">Acces rapides</h2>
      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <QuickLink to={`${base}/membres`} label="Gerer les membres" color="bg-amber-400/10 border-amber-400/30 text-amber-400" />
        <QuickLink to={`${base}/paiements`} label="Gerer les paiements" color="bg-green-500/10 border-green-500/30 text-green-400" />
        <QuickLink to={`${base}/presences`} label="Presences en salle" color="bg-blue-500/10 border-blue-500/30 text-blue-400" />
        <QuickLink to={`${base}/analytics`} label="Statistiques" color="bg-purple-500/10 border-purple-500/30 text-purple-400" />
        <QuickLink to={`${base}/boutique`} label="Boutique" color="bg-pink-500/10 border-pink-500/30 text-pink-400" />
        <QuickLink to={`${base}/promos`} label="Codes promo" color="bg-cyan-500/10 border-cyan-500/30 text-cyan-400" />
        <QuickLink to={`${base}/exports`} label="Exporter les donnees" color="bg-orange-500/10 border-orange-500/30 text-orange-400" />
        <QuickLink to={`${base}/settings`} label="Configuration" color="bg-zinc-800 border-zinc-700 text-zinc-300" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, titre, valeur, color }: { icon: any; titre: string; valeur: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} className={color} />
        <span className="text-xs text-zinc-400">{titre}</span>
      </div>
      <div className={`text-xl font-black ${color}`}>{valeur}</div>
    </div>
  );
}

function AlertCard({ alert }: { alert: { severity: string; title: string; message: string; count: number } }) {
  const colors: Record<string, string> = {
    danger: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-amber-400/10 border-amber-400/30 text-amber-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };
  return (
    <div className={`border rounded-xl p-4 flex items-center gap-3 ${colors[alert.severity] || colors.info}`}>
      <AlertTriangle size={18} />
      <div className="flex-1">
        <div className="font-bold text-sm">{alert.title}</div>
        <div className="text-xs opacity-80 mt-0.5">{alert.message}</div>
      </div>
      <span className="text-lg font-black">{alert.count}</span>
    </div>
  );
}

function QuickLink({ to, label, color }: { to: string; label: string; color: string }) {
  return (
    <Link to={to} className={`border rounded-xl p-4 text-sm font-medium hover:opacity-80 transition ${color}`}>
      {label}
    </Link>
  );
}
