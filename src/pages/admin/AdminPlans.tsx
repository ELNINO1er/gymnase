import { useEffect, useState } from "react";
import { plansApi } from "../../services/api";
import { Plus, Edit2, Trash2, Package, Zap, Crown } from "lucide-react";
import { useConfirm } from "../../components/ui";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

type PlanType = "DURATION" | "SESSIONS" | "VIP";

const planTypeLabels: Record<PlanType, { label: string; icon: typeof Package; color: string }> = {
  DURATION: { label: "Duree", icon: Package, color: "text-blue-400 bg-blue-500/10" },
  SESSIONS: { label: "Pack seances", icon: Zap, color: "text-amber-400 bg-amber-500/10" },
  VIP: { label: "VIP", icon: Crown, color: "text-purple-400 bg-purple-500/10" },
};

const defaultForm = {
  name: "", description: "", price: "", duration_days: "", plan_type: "DURATION" as PlanType,
  sessions_count: "", features: "", is_active: true,
};

export function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  const loadPlans = () => {
    plansApi.getAll(false).then(({ data }) => { setPlans(data.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadPlans(); }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (plan: any) => {
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: String(Number(plan.price)),
      duration_days: String(plan.duration_days),
      plan_type: plan.plan_type || "DURATION",
      sessions_count: plan.sessions_count ? String(plan.sessions_count) : "",
      features: plan.features || "",
      is_active: !!plan.is_active,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      setMessage({ type: "error", text: "Nom et prix requis" });
      return;
    }

    if (form.plan_type === "SESSIONS" && !form.sessions_count) {
      setMessage({ type: "error", text: "Le nombre de seances est requis pour un pack" });
      return;
    }

    if (form.plan_type !== "SESSIONS" && !form.duration_days) {
      setMessage({ type: "error", text: "La duree est requise" });
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      duration_days: form.plan_type === "SESSIONS" ? (Number(form.duration_days) || 365) : Number(form.duration_days),
      plan_type: form.plan_type,
      sessions_count: form.plan_type === "SESSIONS" ? Number(form.sessions_count) : null,
      features: form.features || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await plansApi.update(editingId, payload);
        setMessage({ type: "success", text: "Plan modifie" });
      } else {
        await plansApi.create(payload);
        setMessage({ type: "success", text: "Plan cree" });
      }
      resetForm();
      loadPlans();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur" });
    }
  };

  const handleDelete = (id: number) => {
    const plan = plans.find((p) => p.id === id);
    confirm(
      `Desactiver le plan "${plan?.name}" ? Il ne sera plus visible pour les nouveaux membres.`,
      async () => {
        try {
          await plansApi.delete(id);
          setMessage({ type: "success", text: "Plan desactive" });
          loadPlans();
        } catch (err: any) {
          setMessage({ type: "error", text: err.response?.data?.message || "Erreur" });
        }
      },
      { title: "Desactiver le plan", variant: "warning", confirmLabel: "Desactiver" }
    );
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des plans</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Nouveau plan
        </button>
      </div>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">{editingId ? "Modifier le plan" : "Nouveau plan"}</h3>

          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">Type de plan</label>
            <div className="flex gap-2">
              {(Object.keys(planTypeLabels) as PlanType[]).map((type) => {
                const { label, icon: Icon, color } = planTypeLabels[type];
                const active = form.plan_type === type;
                return (
                  <button key={type} type="button" onClick={() => setForm({ ...form, plan_type: type })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition ${active ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
                    <Icon size={16} /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Prix (FCFA) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>

            {form.plan_type === "SESSIONS" ? (
              <>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nombre de seances *</label>
                  <input type="number" value={form.sessions_count} onChange={(e) => setForm({ ...form, sessions_count: e.target.value })}
                    placeholder="ex: 10"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Validite (jours, optionnel)</label>
                  <input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                    placeholder="365 par defaut"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Duree (jours) *</label>
                <input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Avantages / fonctionnalites</label>
              <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })}
                rows={2} placeholder="ex: Acces illimite, Coaching inclus, Serviette offerte..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">
              {editingId ? "Modifier" : "Creer"}
            </button>
            <button onClick={resetForm} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => {
          const pType = (p.plan_type as PlanType) || "DURATION";
          const typeInfo = planTypeLabels[pType] || planTypeLabels.DURATION;
          const TypeIcon = typeInfo.icon;

          return (
            <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-5 ${p.is_active ? "border-zinc-800" : "border-red-500/30 opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{p.name}</h3>
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                  <TypeIcon size={12} /> {typeInfo.label}
                </span>
              </div>
              {!p.is_active && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Inactif</span>}
              <div className="text-2xl font-black text-amber-400 mb-1">{fmt(Number(p.price))}</div>
              {pType === "SESSIONS" ? (
                <div className="text-sm text-zinc-400 mb-1">{p.sessions_count} seance(s) · valide {p.duration_days}j</div>
              ) : (
                <div className="text-sm text-zinc-400 mb-1">{p.duration_days} jour(s)</div>
              )}
              {p.description && <div className="text-xs text-zinc-500 mb-1">{p.description}</div>}
              {p.features && <div className="text-xs text-zinc-600 mb-1">{p.features}</div>}
              <div className="text-xs text-zinc-600 mb-3">{p.active_subscribers || 0} abonne(s) actif(s)</div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"><Edit2 size={14} /></button>
                {p.is_active && <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
