import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, PauseCircle, Plus, ShieldCheck, Eye } from "lucide-react";
import { platformApi } from "../../services/api";

type GymStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

interface Gym {
  id: number;
  name: string;
  slug: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  city: string | null;
  country: string | null;
  status: GymStatus;
  users_count: number;
  admins_count: number;
}

const statusLabels: Record<GymStatus, string> = {
  PENDING: "En attente",
  ACTIVE: "Validee",
  SUSPENDED: "Suspendue",
};

const statusFilter: { label: string; value: string }[] = [
  { label: "Toutes", value: "" },
  { label: "Actives", value: "ACTIVE" },
  { label: "En attente", value: "PENDING" },
  { label: "Suspendues", value: "SUSPENDED" },
];

export function PlatformGyms() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", owner_name: "", owner_email: "", owner_phone: "", owner_password: "", city: "", country: "",
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await platformApi.gyms(filter || undefined);
      setGyms(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function createGym(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await platformApi.createGym({ ...form, status: "PENDING" });
      setForm({ name: "", owner_name: "", owner_email: "", owner_phone: "", owner_password: "", city: "", country: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: GymStatus) {
    await platformApi.updateGymStatus(id, status);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Gestion</p>
        <h1 className="text-3xl font-black tracking-tight">Salles</h1>
      </div>

      <form onSubmit={createGym} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Plus size={18} className="text-amber-400" />
          Ajouter une salle
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Nom de la salle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Responsable" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Email responsable" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Mot de passe admin" type="password" value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Telephone" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold disabled:opacity-60">
          {saving ? "Creation..." : "Creer la salle"}
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilter.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition ${filter === f.value ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-zinc-400 animate-pulse">Chargement...</div>
        ) : gyms.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucune salle.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {gyms.map((gym) => (
              <div key={gym.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                    <Building2 size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="font-bold">{gym.name}</div>
                    <div className="text-sm text-zinc-400">{gym.slug} · {gym.city || "-"} · {gym.country || "-"}</div>
                    <div className="text-sm text-zinc-500">{gym.owner_name || "-"} {gym.owner_email ? `· ${gym.owner_email}` : ""}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    gym.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" :
                    gym.status === "SUSPENDED" ? "bg-red-500/15 text-red-300" :
                    "bg-amber-500/15 text-amber-300"
                  }`}>
                    {statusLabels[gym.status]}
                  </span>
                  <span className="text-xs text-zinc-500">{gym.users_count} utilisateurs · {gym.admins_count} admins</span>
                  <Link to={`/plateforme/salles/${gym.id}`} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-bold hover:bg-zinc-700 transition">
                    <Eye size={15} /> Detail
                  </Link>
                  {gym.status !== "ACTIVE" && (
                    <button onClick={() => updateStatus(gym.id, "ACTIVE")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold">
                      <CheckCircle2 size={15} /> Valider
                    </button>
                  )}
                  {gym.status === "ACTIVE" && (
                    <button onClick={() => updateStatus(gym.id, "SUSPENDED")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-bold">
                      <PauseCircle size={15} /> Suspendre
                    </button>
                  )}
                  {gym.status === "SUSPENDED" && (
                    <button onClick={() => updateStatus(gym.id, "ACTIVE")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold">
                      <ShieldCheck size={15} /> Reactiver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
