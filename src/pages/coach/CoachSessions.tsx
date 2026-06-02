import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { coachApi } from "../../services/api";

interface Session {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  duration_minutes: number;
  is_active: boolean;
  schedule: string | null;
}

export function CoachSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await coachApi.sessions();
        setSessions(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Espace coach</p>
        <h1 className="text-3xl font-black tracking-tight">Mes seances</h1>
      </div>

      {loading ? (
        <div className="text-zinc-400 animate-pulse">Chargement...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-400">
          <Calendar size={40} className="mx-auto mb-3 text-zinc-600" />
          <p>Aucune seance ne vous est assignee pour le moment.</p>
          <p className="text-sm mt-1">Demandez a l'administrateur de vous assigner des seances.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sessions.map((s) => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{s.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-700 text-zinc-400"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {s.description && <p className="text-sm text-zinc-400 mb-3">{s.description}</p>}
              <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                <span>Capacite : <strong className="text-white">{s.capacity}</strong></span>
                <span>Duree : <strong className="text-white">{s.duration_minutes} min</strong></span>
              </div>
              {s.schedule && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">Horaires</div>
                  <div className="text-sm">{s.schedule}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
