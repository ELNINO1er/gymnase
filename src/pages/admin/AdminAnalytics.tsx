import { useEffect, useState } from "react";
import { analyticsApi, paymentsApi } from "../../services/api";
import { TrendingUp, Clock, Calendar, Users, Shield, CreditCard } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function AdminAnalytics() {
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [topMembers, setTopMembers] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [revenueByMethod, setRevenueByMethod] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.peakHours(30), analyticsApi.popularSessions(30), analyticsApi.profitableDays(90),
      analyticsApi.topMembers(30, 10), analyticsApi.retention(),
      paymentsApi.monthlyStats(),
    ]).then(([ph, ps, pd, tm, ret, ms]) => {
      setPeakHours(ph.data.data.hours || []);
      setSessions(ps.data.data.sessions || []);
      setDays(pd.data.data.days || []);
      setTopMembers(tm.data.data.members || []);
      setRetention(ret.data.data);
      setRevenueByMethod(ms.data.data.by_method || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Statistiques et analyses</h1>

      {/* Retention */}
      {retention && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Shield} label="Taux de retention" value={`${retention.retention_rate}%`} color="text-green-400" />
          <StatCard icon={Users} label="Membres actifs" value={retention.active} color="text-green-400" />
          <StatCard icon={Users} label="Expires" value={retention.expired} color="text-red-400" />
          <StatCard icon={TrendingUp} label="Renouvellements ce mois" value={retention.renewals_this_month} color="text-blue-400" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Heures fortes */}
        <Section titre="Heures de pointe (30 jours)" icon={Clock}>
          {peakHours.length === 0 ? <p className="text-zinc-500 text-sm">Pas de donnees</p> : (
            <div className="space-y-1">
              {peakHours.slice(0, 12).map((h) => (
                <div key={h.hour} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-zinc-400">{String(h.hour).padStart(2, "0")}h</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (h.entries / Math.max(...peakHours.map((p: any) => p.entries))) * 100)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-xs">{h.entries}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Seances populaires */}
        <Section titre="Seances les plus demandees" icon={Calendar}>
          {sessions.length === 0 ? <p className="text-zinc-500 text-sm">Pas de donnees</p> : (
            <div className="space-y-2">
              {sessions.map((s: any) => (
                <div key={s.name} className="bg-zinc-950 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-zinc-500">{s.total_bookings} reservations &middot; {s.completed} completees &middot; {s.cancelled} annulees</div>
                  </div>
                  <span className="text-amber-400 font-bold text-sm">{s.total_bookings}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Jours rentables */}
        <Section titre="Jours les plus rentables (90j)" icon={TrendingUp}>
          {days.length === 0 ? <p className="text-zinc-500 text-sm">Pas de donnees</p> : (
            <div className="space-y-2">
              {days.map((d: any) => (
                <div key={d.day_name} className="flex items-center justify-between text-sm py-1">
                  <span className="text-zinc-300">{d.day_name}</span>
                  <span className="font-bold text-amber-400">{fmt(Number(d.revenue))} FCFA</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Top membres */}
        <Section titre="Membres les plus actifs (30j)" icon={Users}>
          {topMembers.length === 0 ? <p className="text-zinc-500 text-sm">Pas de donnees</p> : (
            <div className="space-y-2">
              {topMembers.map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold w-5">#{i + 1}</span>
                    <span>{m.full_name}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{m.visits} visite(s) &middot; {m.reservations} resv.</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Revenus par methode */}
        <Section titre="Revenus par methode de paiement (ce mois)" icon={CreditCard}>
          {revenueByMethod.length === 0 ? <p className="text-zinc-500 text-sm">Pas de donnees</p> : (
            <div className="space-y-2">
              {revenueByMethod.map((m: any) => (
                <div key={m.payment_method} className="flex items-center justify-between text-sm py-1">
                  <span className="text-zinc-300">{m.payment_method}</span>
                  <div className="text-right">
                    <span className="font-bold text-amber-400">{fmt(Number(m.total))} FCFA</span>
                    <span className="text-xs text-zinc-500 ml-2">({m.count} paiement{m.count > 1 ? "s" : ""})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ titre, icon: Icon, children }: { titre: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2"><Icon size={18} className="text-amber-400" /> {titre}</h3>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1"><Icon size={15} className={color} /><span className="text-xs text-zinc-400">{label}</span></div>
      <div className={`text-xl font-black ${color}`}>{String(value)}</div>
    </div>
  );
}
