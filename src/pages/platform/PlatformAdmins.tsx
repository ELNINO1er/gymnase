import { useEffect, useState } from "react";
import { UserPlus, ShieldCheck } from "lucide-react";
import { platformApi } from "../../services/api";

interface PlatformAdmin {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

export function PlatformAdmins() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });

  async function load() {
    setLoading(true);
    try {
      const { data } = await platformApi.admins();
      setAdmins(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      await platformApi.createAdmin(form);
      setForm({ full_name: "", email: "", phone: "", password: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Gestion</p>
        <h1 className="text-3xl font-black tracking-tight">Super admins plateforme</h1>
      </div>

      <form onSubmit={createAdmin} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <UserPlus size={18} className="text-amber-400" />
          Creer un super admin
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Nom complet" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Mot de passe" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold disabled:opacity-60">
          {saving ? "Creation..." : "Creer"}
        </button>
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-bold">Super admins ({admins.length})</div>
        {loading ? (
          <div className="p-6 text-zinc-400 animate-pulse">Chargement...</div>
        ) : admins.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucun super admin.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {admins.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center gap-3">
                <div className="bg-amber-400/10 rounded-lg p-2"><ShieldCheck size={18} className="text-amber-400" /></div>
                <div className="flex-1">
                  <div className="font-bold">{admin.full_name}</div>
                  <div className="text-sm text-zinc-400">{admin.email} · {admin.phone}</div>
                </div>
                <div className="text-xs text-zinc-500">{new Date(admin.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
