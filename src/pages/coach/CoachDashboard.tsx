import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Users, Calendar, Clock } from "lucide-react";
import { coachApi } from "../../services/api";

interface DashboardData {
  plans: { total_plans: number; active_plans: number; completed_plans: number };
  members_count: number;
  today_sessions: { name: string; start_time: string; end_time: string; bookings: number; capacity: number }[];
  upcoming_sessions: { id: number; name: string; capacity: number; start_time: string; end_time: string; day_of_week: string }[];
}

const dayLabels: Record<string, string> = {
  MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi", THURSDAY: "Jeudi",
  FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
};

export function CoachDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await coachApi.dashboard();
        setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-zinc-400 animate-pulse p-8">Chargement...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Espace coach</p>
        <h1 className="text-3xl font-black tracking-tight">Tableau de bord</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Programmes actifs" value={data.plans.active_plans} icon={<ClipboardList size={20} />} color="text-amber-400" />
        <StatCard label="Programmes termines" value={data.plans.completed_plans} icon={<ClipboardList size={20} />} color="text-emerald-400" />
        <StatCard label="Membres suivis" value={data.members_count} icon={<Users size={20} />} />
        <StatCard label="Total programmes" value={data.plans.total_plans} icon={<ClipboardList size={20} />} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-bold flex items-center gap-2">
          <Calendar size={18} className="text-amber-400" />
          Seances d'aujourd'hui
        </div>
        {data.today_sessions.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucune seance prevue aujourd'hui.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {data.today_sessions.map((s, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-sm text-zinc-400">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{s.bookings}/{s.capacity}</div>
                  <div className="text-xs text-zinc-500">inscrits</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-bold flex items-center gap-2">
          <Clock size={18} className="text-amber-400" />
          Planning hebdomadaire
        </div>
        {data.upcoming_sessions.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucune seance assignee.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {data.upcoming_sessions.map((s, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-sm text-zinc-400">{dayLabels[s.day_of_week] || s.day_of_week}</div>
                </div>
                <div className="text-sm text-zinc-400">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link to="/coach/membres" className="px-4 py-2.5 rounded-lg bg-zinc-800 text-sm font-bold hover:bg-zinc-700 transition">Voir mes membres</Link>
        <Link to="/coach/programmes" className="px-4 py-2.5 rounded-lg bg-amber-400 text-zinc-950 text-sm font-bold">Gerer les programmes</Link>
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
