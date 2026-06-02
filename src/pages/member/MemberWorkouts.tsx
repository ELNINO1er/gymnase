import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Dumbbell, MessageSquare, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { workoutsApi } from "../../services/api";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

export function MemberWorkouts() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!user) return;
    workoutsApi.getUserPlans(user.id).then(({ data }) => {
      const nextPlans = data.data || [];
      setPlans(nextPlans);
      const active = nextPlans.find((plan: any) => plan.status === "ACTIVE") || nextPlans[0];
      if (active?.id) togglePlan(active.id, true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.status === "ACTIVE"), [plans]);
  const totalExercises = useMemo(() => plans.reduce((sum, plan) => sum + Number(plan.exercise_count || 0), 0), [plans]);

  const togglePlan = async (planId: number, forceOpen = false) => {
    if (!forceOpen && expandedId === planId) {
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes programmes</h1>
          <p className="text-sm text-zinc-500 mt-1">Plans du coach, exercices par jour et suivi de progression.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/membre/progression" className="inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-amber-400/60 rounded-lg px-4 py-2 text-sm font-bold transition">
            <TrendingUp size={17} /> Progression
          </Link>
          <Link to="/membre/messages" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg px-4 py-2 text-sm font-bold transition">
            <MessageSquare size={17} /> Coach
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Programmes actifs" value={activePlans.length} icon={<Dumbbell size={18} />} color="text-amber-400" />
        <Stat label="Exercices" value={totalExercises} icon={<Target size={18} />} />
        <Stat label="Dernier programme" value={plans[0] ? formatDate(plans[0].created_at) : "-"} icon={<CalendarDays size={18} />} />
      </div>

      {plans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Dumbbell className="mx-auto text-zinc-600 mb-3" size={44} />
          <div className="font-bold">Aucun programme pour le moment</div>
          <p className="text-zinc-500 text-sm mt-2 max-w-xl mx-auto">
            Un coach ou un admin doit vous affecter un programme depuis l'espace admin. Ajoutez vos objectifs dans la progression pour faciliter la creation du plan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-5">
            <Link to="/membre/progression" className="bg-zinc-950 border border-zinc-700 hover:border-amber-400/60 rounded-lg px-4 py-2 text-sm font-bold transition">
              Renseigner mes objectifs
            </Link>
            <Link to="/membre/messages" className="bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg px-4 py-2 text-sm font-bold transition">
              Contacter l'administration
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const planExercises = exercises[plan.id] || [];
            const byDay: Record<number, any[]> = {};
            for (const exercise of planExercises) {
              const day = Number(exercise.day_number || 1);
              if (!byDay[day]) byDay[day] = [];
              byDay[day].push(exercise);
            }

            return (
              <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <button onClick={() => togglePlan(plan.id)} className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-800/50 transition">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-bold text-lg truncate">{plan.title}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plan.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : plan.status === "COMPLETED" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
                        {plan.status}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">
                      {plan.coach_name ? `Coach : ${plan.coach_name} · ` : ""}
                      {plan.exercise_count || 0} exercice(s)
                      {plan.start_date ? ` · Du ${formatDate(plan.start_date)} au ${formatDate(plan.end_date)}` : ""}
                    </div>
                    {plan.description && <div className="text-sm text-zinc-500 mt-2 line-clamp-2">{plan.description}</div>}
                  </div>
                  {expandedId === plan.id ? <ChevronUp size={20} className="text-amber-400 shrink-0" /> : <ChevronDown size={20} className="text-zinc-500 shrink-0" />}
                </button>

                {expandedId === plan.id && (
                  <div className="border-t border-zinc-800 p-5">
                    {planExercises.length === 0 ? (
                      <p className="text-zinc-500 text-sm">Aucun exercice dans ce programme.</p>
                    ) : (
                      <div className="space-y-5">
                        {Object.entries(byDay).map(([day, dayExercises]) => (
                          <div key={day}>
                            <div className="text-sm font-bold text-amber-400 mb-2">Jour {day}</div>
                            <div className="grid gap-2">
                              {dayExercises.map((exercise: any, index: number) => (
                                <div key={exercise.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-bold">{index + 1}. {exercise.exercise_name}</div>
                                      <div className="flex flex-wrap gap-2 text-xs text-zinc-400 mt-2">
                                        {exercise.sets_count && <Badge>{exercise.sets_count} series</Badge>}
                                        {exercise.reps_count && <Badge>{exercise.reps_count} reps</Badge>}
                                        {exercise.weight_kg && <Badge>{Number(exercise.weight_kg)} kg</Badge>}
                                        {exercise.duration_minutes && <Badge>{exercise.duration_minutes} min</Badge>}
                                        {exercise.rest_seconds !== null && exercise.rest_seconds !== undefined && <Badge>Repos {exercise.rest_seconds}s</Badge>}
                                      </div>
                                      {exercise.notes && <div className="text-xs text-zinc-500 mt-2">{exercise.notes}</div>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, color = "text-white" }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">{icon} {label}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5">{children}</span>;
}
