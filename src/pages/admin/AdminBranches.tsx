import { useEffect, useState } from "react";
import { branchesApi } from "../../services/api";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import { useConfirm } from "../../components/ui";

export function AdminBranches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", city: "", email: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, []);
  const load = () => { branchesApi.getAll().then(({ data }) => { setBranches(data.data); setLoading(false); }).catch(() => setLoading(false)); };

  const handleSubmit = async () => {
    if (!form.name) { setMsg({ type: "error", text: "Nom requis" }); return; }
    try {
      await branchesApi.create(form);
      setMsg({ type: "success", text: "Branche creee" }); setShowForm(false);
      setForm({ name: "", address: "", phone: "", city: "", email: "" }); load();
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.message || "Erreur" }); }
  };

  const handleDelete = (id: number) => {
    confirm("Desactiver cette branche ?", async () => { await branchesApi.delete(id); load(); }, { title: "Desactiver", variant: "warning", confirmLabel: "Desactiver" });
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Multi-salles</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm"><Plus size={16} /> Nouvelle branche</button>
      </div>
      {msg.text && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-3">
          <div><label className="block text-xs text-zinc-400 mb-1">Nom *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Ville</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Telephone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
          <button onClick={handleSubmit} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm sm:col-span-2 w-fit">Creer</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {branches.map((b) => (
          <div key={b.id} className={`bg-zinc-900 border rounded-2xl p-5 ${b.is_active ? "border-zinc-800" : "border-red-500/30 opacity-50"}`}>
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-amber-400" /><span className="font-bold">{b.name}</span></div>
            <div className="text-sm text-zinc-400">{b.city} &middot; {b.address}</div>
            <div className="text-xs text-zinc-500 mt-1">{b.phone} &middot; {b.member_count || 0} membre(s)</div>
            {b.is_active && <button onClick={() => handleDelete(b.id)} className="mt-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}
