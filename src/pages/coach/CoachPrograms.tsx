import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { workoutsApi, coachApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Plan {
  id: number;
  user_id: number;
  member_name: string;
  coach_name: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  exercise_count: number;
  exercises?: Exercise[];
}

interface Exercise {
  id: number;
  day_number: number;
  exercise_name: string;
  sets_count: number | null;
  reps_count: number | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  notes: string | null;
}

interface Member {
  id: number;
  full_name: string;
}

export function CoachPrograms() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ user_id: 0, title: "", description: "", start_date: "", end_date: "" });
  const [exercises, setExercises] = useState<{ day_number: number; exercise_name: string; sets_count: string; reps_count: string; weight_kg: string; duration_minutes: string; notes: string }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([workoutsApi.getAll(), coachApi.members()]);
      setPlans(p.data.data || []);
      setMembers(m.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleExpand(id: number) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    const { data } = await workoutsApi.getDetail(id);
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, exercises: data.data.exercises } : p));
    setExpanded(id);
  }

  function addExercise() {
    setExercises([...exercises, { day_number: 1, exercise_name: "", sets_count: "", reps_count: "", weight_kg: "", duration_minutes: "", notes: "" }]);
  }

  function removeExercise(i: number) {
    setExercises(exercises.filter((_, j) => j !== i));
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!form.user_id || !form.title.trim()) return;
    setSaving(true);
    try {
      await workoutsApi.create({
        user_id: form.user_id,
        title: form.title,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        exercises: exercises.filter((ex) => ex.exercise_name.trim()).map((ex, i) => ({
          day_number: ex.day_number || 1,
          exercise_name: ex.exercise_name,
          sets_count: Number(ex.sets_count) || null,
          reps_count: Number(ex.reps_count) || null,
          weight_kg: Number(ex.weight_kg) || null,
          duration_minutes: Number(ex.duration_minutes) || null,
          notes: ex.notes || null,
          sort_order: i,
        })),
      });
      setForm({ user_id: 0, title: "", description: "", start_date: "", end_date: "" });
      setExercises([]);
      setShowCreate(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    await workoutsApi.updateStatus(id, status);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-amber-300 font-semibold">Espace coach</p>
          <h1 className="text-3xl font-black tracking-tight">Programmes</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold text-sm">
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createPlan} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="text-lg font-bold">Creer un programme</div>
          <div className="grid md:grid-cols-2 gap-3">
            <select className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}>
              <option value={0}>Selectionner un membre</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Titre du programme" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" type="date" placeholder="Debut" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} style={{ colorScheme: "dark" }} />
            <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" type="date" placeholder="Fin" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} style={{ colorScheme: "dark" }} />
          </div>
          <textarea className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" rows={2} placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Exercices</span>
              <button type="button" onClick={addExercise} className="text-sm text-amber-400 hover:underline">+ Ajouter</button>
            </div>
            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-start">
                <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm" placeholder="Jour" type="number" min={1} value={ex.day_number} onChange={(e) => { const c = [...exercises]; c[i].day_number = Number(e.target.value); setExercises(c); }} />
                <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm col-span-2" placeholder="Exercice" value={ex.exercise_name} onChange={(e) => { const c = [...exercises]; c[i].exercise_name = e.target.value; setExercises(c); }} />
                <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm" placeholder="Series" value={ex.sets_count} onChange={(e) => { const c = [...exercises]; c[i].sets_count = e.target.value; setExercises(c); }} />
                <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm" placeholder="Reps" value={ex.reps_count} onChange={(e) => { const c = [...exercises]; c[i].reps_count = e.target.value; setExercises(c); }} />
                <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm" placeholder="Poids (kg)" value={ex.weight_kg} onChange={(e) => { const c = [...exercises]; c[i].weight_kg = e.target.value; setExercises(c); }} />
                <button type="button" onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-300 p-1.5"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <button disabled={saving} className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold disabled:opacity-60">
            {saving ? "Creation..." : "Creer le programme"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-zinc-400 animate-pulse">Chargement...</div>
      ) : plans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-400">Aucun programme.</div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <button onClick={() => toggleExpand(plan.id)} className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition">
                <div>
                  <div className="font-bold">{plan.title}</div>
                  <div className="text-sm text-zinc-400">Pour {plan.member_name} · {plan.exercise_count} exercice(s)</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${plan.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" : plan.status === "COMPLETED" ? "bg-blue-500/15 text-blue-300" : "bg-zinc-700 text-zinc-400"}`}>
                    {plan.status}
                  </span>
                  {expanded === plan.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {expanded === plan.id && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  {plan.description && <p className="text-sm text-zinc-400">{plan.description}</p>}
                  {plan.start_date && <p className="text-xs text-zinc-500">Du {plan.start_date} au {plan.end_date || "..."}</p>}

                  {plan.exercises && plan.exercises.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-zinc-300">Exercices</div>
                      {plan.exercises.map((ex) => (
                        <div key={ex.id} className="bg-zinc-950 rounded-lg p-3 flex flex-wrap gap-3 text-sm">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-xs text-zinc-400">J{ex.day_number}</span>
                          <span className="font-bold">{ex.exercise_name}</span>
                          {ex.sets_count && <span className="text-zinc-400">{ex.sets_count} series</span>}
                          {ex.reps_count && <span className="text-zinc-400">{ex.reps_count} reps</span>}
                          {ex.weight_kg && <span className="text-zinc-400">{ex.weight_kg} kg</span>}
                          {ex.duration_minutes && <span className="text-zinc-400">{ex.duration_minutes} min</span>}
                          {ex.notes && <span className="text-zinc-500 italic">{ex.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {plan.status === "ACTIVE" && (
                      <button onClick={() => updateStatus(plan.id, "COMPLETED")} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-bold">Terminer</button>
                    )}
                    {plan.status !== "CANCELLED" && (
                      <button onClick={() => updateStatus(plan.id, "CANCELLED")} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-bold">Annuler</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
