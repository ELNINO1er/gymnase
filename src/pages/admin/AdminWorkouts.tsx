import { useEffect, useState } from "react";
import { workoutsApi } from "../../services/api";
import { Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useConfirm } from "../../components/ui";

interface ExerciseForm { day_number: number; exercise_name: string; sets_count: string; reps_count: string; weight_kg: string; duration_minutes: string; notes: string }
const emptyExercise = (): ExerciseForm => ({ day_number: 1, exercise_name: "", sets_count: "", reps_count: "", weight_kg: "", duration_minutes: "", notes: "" });

export function AdminWorkouts() {
  const [plans, setPlans] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  // Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id: "", title: "", description: "", start_date: "", end_date: "" });
  const [exercises, setExercises] = useState<ExerciseForm[]>([emptyExercise()]);

  useEffect(() => { load(); }, []);
  const load = (page = 1) => {
    workoutsApi.getAll({ page }).then(({ data }) => { setPlans(data.data); setPagination(data.pagination); setLoading(false); }).catch(() => setLoading(false));
  };

  const handleDelete = (id: number) => {
    confirm("Supprimer ce programme ?", async () => { await workoutsApi.delete(id); load(); }, { title: "Supprimer", variant: "danger", confirmLabel: "Supprimer" });
  };

  const addExercise = () => setExercises([...exercises, emptyExercise()]);
  const removeExercise = (i: number) => setExercises(exercises.filter((_, idx) => idx !== i));
  const updateExercise = (i: number, field: string, value: any) => {
    setExercises(exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  };

  const handleCreate = async () => {
    if (!form.user_id || !form.title) { setMsg({ type: "error", text: "ID membre et titre requis" }); return; }
    const validExercises = exercises.filter((ex) => ex.exercise_name.trim());
    if (validExercises.length === 0) { setMsg({ type: "error", text: "Ajoutez au moins un exercice" }); return; }

    try {
      await workoutsApi.create({
        user_id: Number(form.user_id),
        title: form.title,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        exercises: validExercises.map((ex, i) => ({
          day_number: Number(ex.day_number) || 1,
          exercise_name: ex.exercise_name,
          sets_count: ex.sets_count ? Number(ex.sets_count) : null,
          reps_count: ex.reps_count ? Number(ex.reps_count) : null,
          weight_kg: ex.weight_kg ? Number(ex.weight_kg) : null,
          duration_minutes: ex.duration_minutes ? Number(ex.duration_minutes) : null,
          notes: ex.notes || null,
          sort_order: i,
        })),
      });
      setMsg({ type: "success", text: "Programme cree" });
      setShowForm(false);
      setForm({ user_id: "", title: "", description: "", start_date: "", end_date: "" });
      setExercises([emptyExercise()]);
      load();
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.message || "Erreur" }); }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Programmes d'entrainement</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Nouveau programme
        </button>
      </div>

      {msg.text && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>}

      {/* Formulaire creation */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">Creer un programme</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div><label className="block text-xs text-zinc-400 mb-1">ID du membre *</label>
              <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="ID"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Titre *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Perte de poids 4 semaines"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Date debut</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm" style={{ colorScheme: "dark" }} /></div>
          </div>

          {/* Exercices */}
          <h4 className="font-bold text-sm mb-2">Exercices</h4>
          <div className="space-y-3 mb-4">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-zinc-950 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end relative">
                <div><label className="block text-xs text-zinc-500 mb-0.5">Jour</label>
                  <input type="number" min="1" value={ex.day_number} onChange={(e) => updateExercise(i, "day_number", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div className="col-span-2 sm:col-span-1"><label className="block text-xs text-zinc-500 mb-0.5">Exercice *</label>
                  <input value={ex.exercise_name} onChange={(e) => updateExercise(i, "exercise_name", e.target.value)} placeholder="Nom"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div><label className="block text-xs text-zinc-500 mb-0.5">Series</label>
                  <input type="number" value={ex.sets_count} onChange={(e) => updateExercise(i, "sets_count", e.target.value)} placeholder="3"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div><label className="block text-xs text-zinc-500 mb-0.5">Reps</label>
                  <input type="number" value={ex.reps_count} onChange={(e) => updateExercise(i, "reps_count", e.target.value)} placeholder="12"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div><label className="block text-xs text-zinc-500 mb-0.5">Poids (kg)</label>
                  <input type="number" step="0.5" value={ex.weight_kg} onChange={(e) => updateExercise(i, "weight_kg", e.target.value)} placeholder="20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div><label className="block text-xs text-zinc-500 mb-0.5">Duree (min)</label>
                  <input type="number" value={ex.duration_minutes} onChange={(e) => updateExercise(i, "duration_minutes", e.target.value)} placeholder="30"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                <div><label className="block text-xs text-zinc-500 mb-0.5">Notes</label>
                  <input value={ex.notes} onChange={(e) => updateExercise(i, "notes", e.target.value)} placeholder="..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none" /></div>
                {exercises.length > 1 && (
                  <button onClick={() => removeExercise(i)} className="absolute top-1 right-1 text-zinc-600 hover:text-red-400"><X size={14} /></button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addExercise} className="text-amber-400 text-sm font-medium mb-4 hover:text-amber-300">+ Ajouter un exercice</button>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">Creer le programme</button>
            <button onClick={() => setShowForm(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {plans.length === 0 && !showForm ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Dumbbell className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun programme</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">{p.title}</div>
                <div className="text-sm text-zinc-400">Membre : {p.member_name} &middot; Coach : {p.coach_name || "—"} &middot; {p.exercise_count} exercice(s)</div>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${p.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-400"}`}>{p.status}</span>
              </div>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
