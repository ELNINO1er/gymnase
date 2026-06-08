import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Users, DollarSign, UserPlus, Shield } from "lucide-react";
import { platformApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface GymDetail {
  id: number;
  name: string;
  slug: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  city: string | null;
  country: string | null;
  status: string;
  users_count: number;
  members_count: number;
  admins_count: number;
  coaches_count: number;
  active_subscriptions: number;
  revenue: {
    total: number;
    month: number;
    pending: number;
    paid_count: number;
    pending_count: number;
  };
  admins: { id: number; full_name: string; email: string; phone: string; role: string; status: string; created_at: string }[];
}

export function PlatformGymDetail() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const { slugOrId } = useParams();
  const [gym, setGym] = useState<GymDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [lastAdminLogin, setLastAdminLogin] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await platformApi.getGymDetail(slugOrId || "");
      setGym(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [slugOrId]);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminForm.full_name.trim() || !adminForm.email.trim()) return;
    setSavingAdmin(true);
    try {
      await platformApi.createGymAdmin(gym!.id, adminForm);
      setLastAdminLogin({ email: adminForm.email, password: adminForm.password });
      setAdminForm({ full_name: "", email: "", phone: "", password: "" });
      setShowAdminForm(false);
      await load();
    } finally {
      setSavingAdmin(false);
    }
  }

  if (loading) return <div className="text-zinc-400 animate-pulse p-8">Chargement...</div>;
  if (!gym) return <div className="text-zinc-400 p-8">Salle introuvable.</div>;

  const statusColor = gym.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" : gym.status === "SUSPENDED" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300";

  return (
    <div className="space-y-6">
      <Link to="/plateforme/salles" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition">
        <ArrowLeft size={16} /> Retour aux salles
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2"><Building2 size={24} className="text-amber-400" /></div>
            <div>
              <h1 className="text-2xl font-black">{gym.name}</h1>
              <p className="text-sm text-zinc-400">{gym.slug} · {gym.city || "-"}, {gym.country || "-"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusColor}`}>
            {gym.status === "ACTIVE" ? "Active" : gym.status === "SUSPENDED" ? "Suspendue" : "En attente"}
          </span>
          {gym.status === "ACTIVE" && (
            <button onClick={async () => {
              const { data } = await platformApi.switchGym(gym.slug);
              localStorage.setItem("token", data.data.token);
              await refreshUser();
              navigate(`/g/${gym.slug}/admin`);
            }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 text-zinc-950 text-sm font-bold">
              <ArrowRight size={15} /> Administrer
            </button>
          )}
        </div>
      </div>

      {gym.owner_name && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400 mb-1">Proprietaire</div>
          <div className="font-bold">{gym.owner_name}</div>
          <div className="text-sm text-zinc-400">{gym.owner_email} · {gym.owner_phone}</div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Membres" value={gym.members_count} icon={<Users size={18} />} />
        <Stat label="Coachs" value={gym.coaches_count} icon={<Users size={18} />} />
        <Stat label="Abonnements actifs" value={gym.active_subscriptions} icon={<Shield size={18} />} />
        <Stat label="Revenu total" value={`${gym.revenue.total.toLocaleString()}`} icon={<DollarSign size={18} />} color="text-amber-400" />
        <Stat label="Revenu du mois" value={`${gym.revenue.month.toLocaleString()}`} icon={<DollarSign size={18} />} color="text-emerald-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400">Paiements valides</div>
          <div className="text-2xl font-black">{gym.revenue.paid_count}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm text-zinc-400">Paiements en attente</div>
          <div className="text-2xl font-black text-amber-400">{gym.revenue.pending_count} ({gym.revenue.pending.toLocaleString()} FCFA)</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-bold">Administrateurs ({gym.admins.length})</span>
          <button onClick={() => setShowAdminForm(!showAdminForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-950 text-sm font-bold">
            <UserPlus size={15} /> Ajouter
          </button>
        </div>

        {showAdminForm && (
          <form onSubmit={createAdmin} className="p-4 border-b border-zinc-800 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Nom complet" value={adminForm.full_name} onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} />
              <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
              <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Telephone" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
              <input className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2" placeholder="Mot de passe" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
            </div>
            <button disabled={savingAdmin} className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold disabled:opacity-60">
              {savingAdmin ? "Creation..." : "Creer l'admin"}
            </button>
          </form>
        )}

        {lastAdminLogin && (
          <div className="p-4 border-b border-zinc-800 bg-amber-400/10 text-sm">
            <div className="font-bold text-amber-300">Admin pret a se connecter</div>
            <div className="text-zinc-300 mt-1">
              Utilisez <span className="font-mono text-white">/admin/login</span> avec
              <span className="font-mono text-white"> {lastAdminLogin.email}</span> et le mot de passe saisi lors de la creation.
            </div>
          </div>
        )}

        {gym.admins.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucun admin pour cette salle.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {gym.admins.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{admin.full_name}</div>
                  <div className="text-sm text-zinc-400">{admin.email} · {admin.phone}</div>
                </div>
                <div className="text-xs text-zinc-500">{admin.role} · {new Date(admin.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color = "text-white" }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">{icon} {label}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
    </div>
  );
}
