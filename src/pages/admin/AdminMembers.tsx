import { useEffect, useState } from "react";
import { usersApi } from "../../services/api";
import { Search, Trash2, UserCheck, UserX, RefreshCw } from "lucide-react";
import { useConfirm, Select } from "../../components/ui";

const ROLE_OPTIONS = [
  { value: "", label: "Tous roles" },
  { value: "MEMBER", label: "Membre" },
  { value: "VISITOR", label: "Visiteur" },
  { value: "ADMIN", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tous statuts" },
  { value: "ACTIVE", label: "Actif" },
  { value: "PENDING", label: "En attente" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "EXPIRED", label: "Expire" },
];

export function AdminMembers() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ keyword: "", role: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll({ page, keyword: filters.keyword, role: filters.role, status: filters.status });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const search = () => loadUsers(1);

  const handleAction = (action: string, userId: number, userName: string) => {
    const config: Record<string, { title: string; msg: string; variant: "danger" | "warning" | "success"; label: string }> = {
      Valider: { title: "Valider l'inscription", msg: `Confirmer la validation de ${userName} ? Ce membre pourra se connecter et reserver des seances.`, variant: "success", label: "Valider" },
      Suspendre: { title: "Suspendre le membre", msg: `Suspendre le compte de ${userName} ? Ce membre ne pourra plus se connecter.`, variant: "warning", label: "Suspendre" },
      Reactiver: { title: "Reactiver le membre", msg: `Reactiver le compte de ${userName} ?`, variant: "success", label: "Reactiver" },
      Supprimer: { title: "Supprimer le membre", msg: `Supprimer definitivement ${userName} ? Cette action annulera ses abonnements et reservations.`, variant: "danger", label: "Supprimer" },
    };

    const c = config[action];
    if (!c) return;

    confirm(c.msg, async () => {
      try {
        if (action === "Valider") await usersApi.validate(userId);
        else if (action === "Suspendre") await usersApi.suspend(userId);
        else if (action === "Reactiver") await usersApi.reactivate(userId);
        else if (action === "Supprimer") await usersApi.delete(userId);
        setMessage({ type: "success", text: `${action} effectue pour ${userName}` });
        loadUsers(pagination.page);
      } catch (err: any) {
        setMessage({ type: "error", text: err.response?.data?.error || "Erreur" });
      }
    }, { title: c.title, variant: c.variant, confirmLabel: c.label });
  };

  return (
    <div>
      {dialog}
      <h1 className="text-2xl font-bold mb-6">Gestion des membres</h1>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Rechercher (nom, email, tel, code)..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
        </div>
        <Select value={filters.role} onChange={(v) => setFilters({ ...filters, role: v })} options={ROLE_OPTIONS} placeholder="Tous roles" />
        <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} placeholder="Tous statuts" />
        <button onClick={search} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Search size={16} />
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-zinc-400">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Aucun membre trouve</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold truncate">{u.full_name}</div>
                <div className="text-sm text-zinc-400">
                  {u.role} &middot; <span className="font-mono text-xs">{u.member_code}</span>
                </div>
                <div className="text-xs text-zinc-500 truncate">{u.email || u.phone}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={u.status} />
                {u.status === "PENDING" && (
                  <button onClick={() => handleAction("Valider", u.id, u.full_name)} title="Valider"
                    className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400"><UserCheck size={16} /></button>
                )}
                {u.status === "ACTIVE" && u.role !== "ADMIN" && (
                  <button onClick={() => handleAction("Suspendre", u.id, u.full_name)} title="Suspendre"
                    className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"><UserX size={16} /></button>
                )}
                {(u.status === "SUSPENDED" || u.status === "EXPIRED") && (
                  <button onClick={() => handleAction("Reactiver", u.id, u.full_name)} title="Reactiver"
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"><RefreshCw size={16} /></button>
                )}
                {u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" && (
                  <button onClick={() => handleAction("Supprimer", u.id, u.full_name)} title="Supprimer"
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i} onClick={() => loadUsers(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-zinc-500 mt-4">{pagination.total} utilisateur(s)</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-400",
    PENDING: "bg-amber-400/10 text-amber-400",
    SUSPENDED: "bg-red-500/10 text-red-400",
    EXPIRED: "bg-orange-500/10 text-orange-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "bg-zinc-800 text-zinc-400"}`}>{status}</span>;
}
