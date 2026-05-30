import { useEffect, useState } from "react";
import { promosApi } from "../../services/api";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useConfirm } from "../../components/ui";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function AdminPromos() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", discount_type: "PERCENTAGE", discount_value: "", min_amount: "0", start_date: "", end_date: "", max_uses: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, []);
  const load = () => { promosApi.getAll().then(({ data }) => { setPromos(data.data); setLoading(false); }).catch(() => setLoading(false)); };

  const handleSubmit = async () => {
    if (!form.code || !form.discount_value) { setMsg({ type: "error", text: "Code et valeur requis" }); return; }
    try {
      if (editId) {
        await promosApi.update(editId, { is_active: true, end_date: form.end_date || null, max_uses: form.max_uses ? Number(form.max_uses) : null });
      } else {
        await promosApi.create({ code: form.code, discount_type: form.discount_type, discount_value: Number(form.discount_value), min_amount: Number(form.min_amount) || 0, start_date: form.start_date || null, end_date: form.end_date || null, max_uses: form.max_uses ? Number(form.max_uses) : null });
      }
      setMsg({ type: "success", text: editId ? "Promo modifiee" : "Promo creee" });
      setShowForm(false); setEditId(null);
      setForm({ code: "", discount_type: "PERCENTAGE", discount_value: "", min_amount: "0", start_date: "", end_date: "", max_uses: "" });
      load();
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.message || "Erreur" }); }
  };

  const handleDelete = (id: number) => {
    confirm("Desactiver ce code promo ?", async () => { await promosApi.delete(id); load(); }, { title: "Desactiver", variant: "warning", confirmLabel: "Desactiver" });
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Codes promo</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Nouveau code
        </button>
      </div>

      {msg.text && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="block text-xs text-zinc-400 mb-1">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                <option value="PERCENTAGE">Pourcentage (%)</option><option value="FIXED">Montant fixe (FCFA)</option>
              </select></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Valeur *</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="20"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Max utilisations</label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Illimite"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Date debut</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm" style={{ colorScheme: "dark" }} /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Date fin</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm" style={{ colorScheme: "dark" }} /></div>
          </div>
          <button onClick={handleSubmit} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm mt-4">
            {editId ? "Modifier" : "Creer"}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((p) => (
          <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-5 ${p.is_active ? "border-zinc-800" : "border-red-500/30 opacity-50"}`}>
            <div className="font-mono text-xl font-black text-amber-400 mb-1">{p.code}</div>
            <div className="text-sm text-zinc-400 mb-2">
              {p.discount_type === "PERCENTAGE" ? `${Number(p.discount_value)}%` : `${fmt(Number(p.discount_value))} FCFA`} de reduction
            </div>
            <div className="text-xs text-zinc-500 space-y-0.5">
              {p.max_uses && <div>Max : {p.max_uses} utilisations ({p.used_count} utilisees)</div>}
              {p.end_date && <div>Expire : {new Date(p.end_date).toLocaleDateString("fr-FR")}</div>}
            </div>
            {p.is_active && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
