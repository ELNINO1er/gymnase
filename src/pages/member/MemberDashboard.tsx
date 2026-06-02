import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, Calendar, CreditCard, Dumbbell, FileText, QrCode, TrendingUp } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { invoicesApi, notificationsApi, paymentsApi, progressApi, reservationsApi, workoutsApi } from "../../services/api";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function MemberDashboard() {
  const { user, subscription } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentsSummary, setPaymentsSummary] = useState({ total_paid: 0, total_pending: 0 });
  const [plans, setPlans] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      reservationsApi.getUserReservations(user.id, true).catch(() => ({ data: { data: [] } })),
      notificationsApi.getAll(true).catch(() => ({ data: { data: { notifications: [] } } })),
      paymentsApi.getUserPayments(user.id).catch(() => ({ data: { data: { summary: { total_paid: 0, total_pending: 0 } } } })),
      workoutsApi.getUserPlans(user.id).catch(() => ({ data: { data: [] } })),
      progressApi.getUserProgress(user.id).catch(() => ({ data: { data: [] } })),
      invoicesApi.getUserInvoices(user.id).catch(() => ({ data: { data: [] } })),
    ]).then(([resRes, notifRes, payRes, workoutRes, progressRes, invoiceRes]) => {
      setUpcoming((resRes.data.data || []).slice(0, 3));
      const notifData = notifRes.data.data;
      setNotifications((Array.isArray(notifData) ? notifData : notifData?.notifications || []).slice(0, 5));
      setPaymentsSummary(payRes.data.data.summary || { total_paid: 0, total_pending: 0 });
      setPlans(workoutRes.data.data || []);
      setProgress(progressRes.data.data || []);
      setInvoices(invoiceRes.data.data || []);
      setLoading(false);
    });
  }, [user]);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000))
    : 0;
  const activePlans = plans.filter((plan) => plan.status === "ACTIVE");
  const latestProgress = progress[0];
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "PENDING");
  const nextReservation = upcoming[0];

  const checklist = useMemo(() => [
    { done: Boolean(subscription), label: "Abonnement actif", to: "/membre/paiements" },
    { done: upcoming.length > 0, label: "Prochaine seance reservee", to: "/membre/reservations" },
    { done: activePlans.length > 0, label: "Programme disponible", to: "/membre/programmes" },
    { done: progress.length > 0, label: "Progression renseignee", to: "/membre/progression" },
  ], [subscription, upcoming.length, activePlans.length, progress.length]);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-zinc-400 text-sm">Bienvenue,</div>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          <div className="text-sm text-zinc-500 mt-1">
            Code membre : <span className="text-amber-400 font-mono">{user?.member_code}</span>
          </div>
        </div>
        <Link to="/membre/qrcode" className="inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-amber-400/60 rounded-lg px-4 py-2 text-sm font-bold transition">
          <QrCode size={17} /> Mon QR Code
        </Link>
      </div>

      {subscription ? (
        <div className="bg-zinc-900 border border-amber-400/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-zinc-400">Abonnement actif</div>
              <div className="text-xl font-bold mt-1">{subscription.plan_name}</div>
              <div className="text-sm text-zinc-400 mt-2">Expire le {formatDate(subscription.end_date)}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-400">{daysLeft}</div>
              <div className="text-xs text-zinc-400">jours restants</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 mb-6">
          <div className="text-red-400 font-bold">Aucun abonnement actif</div>
          <div className="text-sm text-zinc-400 mt-1">Effectuez un depot Wave, puis demandez la validation a l'administration.</div>
          <Link to="/membre/paiements" className="text-amber-400 text-sm font-bold mt-3 inline-block hover:text-amber-300">
            Voir le paiement Wave
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric icon={<Calendar size={18} />} label="Prochaine seance" value={nextReservation ? `${nextReservation.session_name}` : "A planifier"} meta={nextReservation ? `${formatDate(nextReservation.reservation_date)} · ${nextReservation.start_time?.slice(0, 5)}` : "Aucune reservation"} to="/membre/reservations" />
        <Metric icon={<CreditCard size={18} />} label="Paiements en attente" value={fmt(paymentsSummary.total_pending)} meta="Validation admin" to="/membre/paiements" />
        <Metric icon={<Dumbbell size={18} />} label="Programmes actifs" value={activePlans.length} meta={activePlans[0]?.title || "A demander au coach"} to="/membre/programmes" />
        <Metric icon={<TrendingUp size={18} />} label="Derniere mesure" value={latestProgress?.weight ? `${latestProgress.weight} kg` : "Non renseignee"} meta={latestProgress ? formatDate(latestProgress.recorded_at) : "Ajoutez votre suivi"} to="/membre/progression" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Activity size={18} className="text-amber-400" /> Priorites membre</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {checklist.map((item) => (
              <Link key={item.label} to={item.to} className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center gap-3 transition">
                <span className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-green-400" : "bg-amber-400"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><FileText size={18} className="text-amber-400" /> Factures</h2>
          <div className="text-3xl font-black">{invoices.length}</div>
          <div className="text-sm text-zinc-400 mt-1">{pendingInvoices.length} en attente</div>
          <Link to="/membre/factures" className="text-amber-400 text-sm font-bold mt-4 inline-block hover:text-amber-300">
            Consulter mes factures
          </Link>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-3">Prochaines seances</h2>
          <div className="space-y-2">
            {upcoming.map((reservation) => (
              <div key={reservation.id} className="bg-zinc-950 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{reservation.session_name}</div>
                  <div className="text-xs text-zinc-500">{formatDate(reservation.reservation_date)} · {reservation.start_time?.slice(0, 5)} - {reservation.end_time?.slice(0, 5)}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{reservation.status}</span>
              </div>
            ))}
          </div>
          <Link to="/membre/reservations" className="text-amber-400 text-sm font-medium mt-3 inline-block hover:text-amber-300">
            Voir toutes mes reservations
          </Link>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Notifications</h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-zinc-950 rounded-xl p-3">
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{notification.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, meta, to }: { icon: React.ReactNode; label: string; value: React.ReactNode; meta: string; to: string }) {
  return (
    <Link to={to} className="bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 rounded-xl p-4 transition min-h-[120px]">
      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">{icon} {label}</div>
      <div className="text-xl font-black truncate">{value}</div>
      <div className="text-xs text-zinc-500 mt-1 truncate">{meta}</div>
    </Link>
  );
}
