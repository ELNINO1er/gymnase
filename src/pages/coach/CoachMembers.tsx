import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { coachApi } from "../../services/api";

interface Member {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  member_code: string;
  sport_goal: string | null;
  status: string;
  active_plans: number;
  last_visit: string | null;
}

export function CoachMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await coachApi.members();
        setMembers(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function formatDate(d: string | null) {
    if (!d) return "Jamais";
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Espace coach</p>
        <h1 className="text-3xl font-black tracking-tight">Mes membres</h1>
        <p className="text-sm text-zinc-400 mt-1">Membres ayant un programme actif avec vous</p>
      </div>

      {loading ? (
        <div className="text-zinc-400 animate-pulse">Chargement...</div>
      ) : members.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-400">
          <Users size={40} className="mx-auto mb-3 text-zinc-600" />
          <p>Aucun membre suivi pour le moment.</p>
          <p className="text-sm mt-1">Creez des programmes pour vos membres.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800 font-bold">{members.length} membre(s) suivi(s)</div>
          <div className="divide-y divide-zinc-800">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold">{m.full_name}</div>
                  <div className="text-sm text-zinc-400">{m.phone} {m.email ? `· ${m.email}` : ""}</div>
                  {m.sport_goal && <div className="text-xs text-zinc-500 mt-1">Objectif : {m.sport_goal}</div>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-amber-400">{m.active_plans}</div>
                    <div className="text-xs text-zinc-500">programme(s)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{formatDate(m.last_visit)}</div>
                    <div className="text-xs text-zinc-500">derniere visite</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-700 text-zinc-400"}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
