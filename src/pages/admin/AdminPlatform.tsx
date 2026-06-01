import { useEffect, useState } from "react";
import { Building2, CheckCircle2, PauseCircle, Plus, ShieldCheck, UserPlus } from "lucide-react";
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

interface PlatformAdmin {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

const statusLabels: Record<GymStatus, string> = {
  PENDING: "En attente",
  ACTIVE: "Validee",
  SUSPENDED: "Suspendue",
};

export function AdminPlatform() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_password: "",
    city: "",
    country: "",
  });
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [gymsResponse, adminsResponse] = await Promise.all([
        platformApi.gyms(),
        platformApi.admins(),
      ]);
      setGyms(gymsResponse.data.data || []);
      setAdmins(adminsResponse.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createGym(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await platformApi.createGym({
        ...form,
        status: "PENDING",
      });
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

  async function createPlatformAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminForm.full_name.trim() || !adminForm.email.trim() || !adminForm.phone.trim() || !adminForm.password.trim()) return;

    setSavingAdmin(true);
    try {
      await platformApi.createAdmin(adminForm);
      setAdminForm({ full_name: "", email: "", phone: "", password: "" });
      await load();
    } finally {
      setSavingAdmin(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Super administration</p>
        <h1 className="text-3xl font-black tracking-tight">Gestion des salles</h1>
      </div>

      <form onSubmit={createGym} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Plus size={18} className="text-amber-400" />
          Ajouter une salle a verifier
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Nom de la salle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Responsable" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Email responsable" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Mot de passe admin salle" type="password" value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Telephone" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold disabled:opacity-60">
          {saving ? "Creation..." : "Creer la salle"}
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400">Total salles</div>
          <div className="text-2xl font-black">{gyms.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400">En attente</div>
          <div className="text-2xl font-black">{gyms.filter((g) => g.status === "PENDING").length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400">Actives</div>
          <div className="text-2xl font-black">{gyms.filter((g) => g.status === "ACTIVE").length}</div>
        </div>
      </div>

      <form onSubmit={createPlatformAdmin} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <UserPlus size={18} className="text-amber-400" />
          Creer un super admin plateforme
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Nom complet" value={adminForm.full_name} onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Telephone" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
          <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Mot de passe" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
        </div>
        <button disabled={savingAdmin} className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-bold disabled:opacity-60">
          {savingAdmin ? "Creation..." : "Creer le super admin"}
        </button>
        <div className="grid md:grid-cols-2 gap-2">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <div className="font-bold">{admin.full_name}</div>
              <div className="text-sm text-zinc-400">{admin.email} · {admin.phone}</div>
            </div>
          ))}
        </div>
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-bold">Salles enregistrees</div>
        {loading ? (
          <div className="p-6 text-zinc-400">Chargement...</div>
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
                    <div className="text-sm text-zinc-400">{gym.slug} · {gym.city || "Ville non renseignee"} · {gym.country || "Pays non renseigne"}</div>
                    <div className="text-sm text-zinc-500">{gym.owner_name || "Responsable non renseigne"} {gym.owner_email ? `· ${gym.owner_email}` : ""}</div>
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
                  <span className="text-xs text-zinc-500">{gym.users_count || 0} utilisateurs</span>
                  {gym.status !== "ACTIVE" && (
                    <button onClick={() => updateStatus(gym.id, "ACTIVE")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold">
                      <CheckCircle2 size={15} /> Valider
                    </button>
                  )}
                  {gym.status !== "SUSPENDED" && (
                    <button onClick={() => updateStatus(gym.id, "SUSPENDED")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-bold">
                      <PauseCircle size={15} /> Suspendre
                    </button>
                  )}
                  {gym.status === "SUSPENDED" && (
                    <button onClick={() => updateStatus(gym.id, "PENDING")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-bold">
                      <ShieldCheck size={15} /> Revoir
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
