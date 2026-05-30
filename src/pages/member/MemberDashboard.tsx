import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { reservationsApi, notificationsApi } from "../../services/api";
import { Bell, Calendar, CreditCard, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";

export function MemberDashboard() {
  const { user, subscription } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      reservationsApi.getUserReservations(user.id, true).catch(() => ({ data: { data: [] } })),
      notificationsApi.getAll(true).catch(() => ({ data: { data: { notifications: [] } } })),
    ]).then(([resRes, notifRes]) => {
      setUpcoming(resRes.data.data.slice(0, 3));
      setNotifications(notifRes.data.data.notifications.slice(0, 5));
      setLoading(false);
    });
  }, [user]);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="mb-6">
        <div className="text-zinc-400 text-sm">Bienvenue,</div>
        <h1 className="text-2xl font-bold">{user?.full_name}</h1>
        <div className="text-sm text-zinc-500 mt-1">
          Code membre : <span className="text-amber-400 font-mono">{user?.member_code}</span>
        </div>
      </div>

      {/* Abonnement */}
      {subscription ? (
        <div className="bg-zinc-900 border border-amber-400/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400">Abonnement actif</div>
              <div className="text-xl font-bold mt-1">{subscription.plan_name}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-400">{daysLeft}</div>
              <div className="text-xs text-zinc-400">jours restants</div>
            </div>
          </div>
          <div className="text-sm text-zinc-400 mt-2">
            Expire le {new Date(subscription.end_date).toLocaleDateString("fr-FR")}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 mb-6">
          <div className="text-red-400 font-bold">Aucun abonnement actif</div>
          <div className="text-sm text-zinc-400 mt-1">Contactez l'administration pour souscrire.</div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Link to="/membre/reservations" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-amber-400/50 transition text-center">
          <Calendar className="text-amber-400 mx-auto mb-2" size={24} />
          <div className="font-bold text-sm">Reserver</div>
        </Link>
        <Link to="/membre/paiements" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-amber-400/50 transition text-center">
          <CreditCard className="text-amber-400 mx-auto mb-2" size={24} />
          <div className="font-bold text-sm">Paiements</div>
        </Link>
        <Link to="/membre/profil" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-amber-400/50 transition text-center">
          <Dumbbell className="text-amber-400 mx-auto mb-2" size={24} />
          <div className="font-bold text-sm">Mon profil</div>
        </Link>
      </div>

      {/* Prochaines seances */}
      {upcoming.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-3">Prochaines seances</h2>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <div key={r.id} className="bg-zinc-950 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.session_name}</div>
                  <div className="text-xs text-zinc-500">{new Date(r.reservation_date).toLocaleDateString("fr-FR")} a {r.start_time?.slice(0, 5)}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{r.status}</span>
              </div>
            ))}
          </div>
          <Link to="/membre/reservations" className="text-amber-400 text-sm font-medium mt-3 inline-block hover:text-amber-300">
            Voir toutes mes reservations →
          </Link>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Notifications</h2>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="bg-zinc-950 rounded-xl p-3">
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
