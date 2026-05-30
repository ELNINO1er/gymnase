import { useEffect, useState } from "react";
import { Plus, TrendingUp, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { progressApi } from "../../services/api";
import { useConfirm } from "../../components/ui";

export function MemberProgress() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight: "", height: "", body_fat: "", muscle_mass: "", goal: "", notes: "", recorded_at: new Date().toISOString().split("T")[0] });
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data } = await progressApi.getUserProgress(user.id);
      setEntries(data.data);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async () => {
    const payload: any = { recorded_at: form.recorded_at };
    if (form.weight) payload.weight = Number(form.weight);
    if (form.height) payload.height = Number(form.height);
    if (form.body_fat) payload.body_fat = Number(form.body_fat);
    if (form.muscle_mass) payload.muscle_mass = Number(form.muscle_mass);
    if (form.goal) payload.goal = form.goal;
    if (form.notes) payload.notes = form.notes;

    try {
      await progressApi.add(payload);
      setMessage({ type: "success", text: "Progression enregistree" });
      setShowForm(false);
      setForm({ weight: "", height: "", body_fat: "", muscle_mass: "", goal: "", notes: "", recorded_at: new Date().toISOString().split("T")[0] });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur" });
    }
  };

  const handleDelete = (id: number) => {
    confirm("Supprimer cette entree ?", async () => {
      await progressApi.delete(id);
      loadData();
    }, { title: "Supprimer", variant: "danger", confirmLabel: "Supprimer" });
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ma progression</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">Nouvelle mesure</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Date *</label>
              <input type="date" value={form.recorded_at} onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Poids (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="75.5"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Taille (cm)</label>
              <input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="180"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Masse grasse (%)</label>
              <input type="number" step="0.1" value={form.body_fat} onChange={(e) => setForm({ ...form, body_fat: e.target.value })} placeholder="18"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Masse musculaire (kg)</label>
              <input type="number" step="0.1" value={form.muscle_mass} onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })} placeholder="35"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Objectif</label>
              <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Perte de poids"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Remarques..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none" rows={2} />
          </div>
          <button onClick={handleSubmit} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm mt-4">
            Enregistrer
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <TrendingUp className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucune mesure enregistree. Ajoutez votre premiere mesure !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{new Date(e.recorded_at).toLocaleDateString("fr-FR")}</span>
                <button onClick={() => handleDelete(e.id)} className="text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {e.weight && <div><span className="text-zinc-500">Poids</span> <span className="font-bold text-amber-400">{Number(e.weight)} kg</span></div>}
                {e.height && <div><span className="text-zinc-500">Taille</span> <span className="font-bold">{Number(e.height)} cm</span></div>}
                {e.body_fat && <div><span className="text-zinc-500">Graisse</span> <span className="font-bold">{Number(e.body_fat)}%</span></div>}
                {e.muscle_mass && <div><span className="text-zinc-500">Muscle</span> <span className="font-bold">{Number(e.muscle_mass)} kg</span></div>}
              </div>
              {e.goal && <div className="text-xs text-zinc-500 mt-2">Objectif : {e.goal}</div>}
              {e.notes && <div className="text-xs text-zinc-600 mt-1">{e.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
