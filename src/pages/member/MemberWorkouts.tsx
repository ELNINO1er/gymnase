import { useEffect, useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { workoutsApi } from "../../services/api";

export function MemberWorkouts() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!user) return;
    workoutsApi.getUserPlans(user.id).then(({ data }) => {
      setPlans(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const togglePlan = async (planId: number) => {
    if (expandedId === planId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(planId);

    if (!exercises[planId]) {
      try {
        const { data } = await workoutsApi.getDetail(planId);
        setExercises((prev) => ({ ...prev, [planId]: data.data.exercises || [] }));
      } catch {}
    }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mes programmes</h1>

      {plans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Dumbbell className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun programme d'entrainement pour le moment.</p>
          <p className="text-zinc-500 text-sm mt-1">Votre coach vous en creera un bientot !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <button onClick={() => togglePlan(plan.id)} className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-800/50 transition">
                <div>
                  <div className="font-bold text-lg">{plan.title}</div>
                  <div className="text-sm text-zinc-400 mt-0.5">
                    {plan.coach_name && <span>Coach : {plan.coach_name} &middot; </span>}
                    {plan.exercise_count} exercice(s)
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${plan.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : plan.status === "COMPLETED" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
                      {plan.status}
                    </span>
                  </div>
                  {plan.description && <div className="text-sm text-zinc-500 mt-1">{plan.description}</div>}
                </div>
                {expandedId === plan.id ? <ChevronUp size={20} className="text-amber-400" /> : <ChevronDown size={20} className="text-zinc-500" />}
              </button>

              {/* Exercices */}
              {expandedId === plan.id && exercises[plan.id] && (
                <div className="border-t border-zinc-800 p-5">
                  {exercises[plan.id].length === 0 ? (
                    <p className="text-zinc-500 text-sm">Aucun exercice dans ce programme.</p>
                  ) : (
                    (() => {
                      // Grouper par jour
                      const byDay: Record<number, any[]> = {};
                      for (const ex of exercises[plan.id]) {
                        const day = ex.day_number || 1;
                        if (!byDay[day]) byDay[day] = [];
                        byDay[day].push(ex);
                      }

                      return Object.entries(byDay).map(([day, exs]) => (
                        <div key={day} className="mb-4 last:mb-0">
                          <div className="text-sm font-bold text-amber-400 mb-2">Jour {day}</div>
                          <div className="space-y-2">
                            {exs.map((ex: any) => (
                              <div key={ex.id} className="bg-zinc-950 rounded-xl p-3">
                                <div className="font-medium">{ex.exercise_name}</div>
                                <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-1">
                                  {ex.sets_count && <span>{ex.sets_count} series</span>}
                                  {ex.reps_count && <span>{ex.reps_count} reps</span>}
                                  {ex.weight_kg && <span>{Number(ex.weight_kg)} kg</span>}
                                  {ex.duration_minutes && <span>{ex.duration_minutes} min</span>}
                                  {ex.rest_seconds && <span>Repos : {ex.rest_seconds}s</span>}
                                </div>
                                {ex.notes && <div className="text-xs text-zinc-500 mt-1">{ex.notes}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
