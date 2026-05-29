import { useEffect, useState } from "react";
import { reservationsApi } from "../../services/api";
import { Calendar, Check, X, AlertTriangle } from "lucide-react";
import { useConfirm, Select } from "../../components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "Tous statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmee" },
  { value: "COMPLETED", label: "Terminee" },
  { value: "CANCELLED", label: "Annulee" },
  { value: "NO_SHOW", label: "Absent" },
];

export function AdminReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ status: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await reservationsApi.getAll({ page, status: filters.status, date: filters.date });
      setReservations(data.data);
      setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = (action: string, id: number, label: string) => {
    const configs: Record<string, { title: string; msg: string; variant: "success" | "warning" | "danger"; label: string }> = {
      complete: { title: "Marquer terminee", msg: `Confirmer que la seance "${label}" est terminee ?`, variant: "success", label: "Terminer" },
      "no-show": { title: "Marquer absent", msg: `Marquer le membre comme absent pour "${label}" ?`, variant: "warning", label: "Absent" },
      cancel: { title: "Annuler la reservation", msg: `Annuler la reservation "${label}" ?`, variant: "danger", label: "Annuler" },
    };

    const c = configs[action];
    if (!c) return;

    confirm(c.msg, async () => {
      try {
        if (action === "complete") await reservationsApi.complete(id);
        else if (action === "cancel") await reservationsApi.cancel(id);
        else if (action === "no-show") await reservationsApi.noShow(id);
        setMessage({ type: "success", text: "Action effectuee" });
        loadData(pagination.page);
      } catch (err: any) {
        setMessage({ type: "error", text: err.response?.data?.error || "Erreur" });
      }
    }, { title: c.title, variant: c.variant, confirmLabel: c.label });
  };

  return (
    <div>
      {dialog}
      <h1 className="text-2xl font-bold mb-6">Gestion des reservations</h1>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" style={{ colorScheme: "dark" }} />
        <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} placeholder="Tous statuts" />
        <button onClick={() => loadData(1)} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          Filtrer
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-zinc-400">Chargement...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Aucune reservation</div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold">{r.session_name}</div>
                <div className="text-sm text-zinc-400">
                  <Calendar size={12} className="inline mr-1" />
                  {new Date(r.reservation_date).toLocaleDateString("fr-FR")} {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{r.user_name} &middot; {r.member_code}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={r.status} />
                {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                  <>
                    <button onClick={() => handleAction("complete", r.id, r.session_name)} title="Terminee"
                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400"><Check size={16} /></button>
                    <button onClick={() => handleAction("no-show", r.id, r.session_name)} title="Absent"
                      className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"><AlertTriangle size={16} /></button>
                    <button onClick={() => handleAction("cancel", r.id, r.session_name)} title="Annuler"
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><X size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i} onClick={() => loadData(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "bg-green-500/10 text-green-400",
    PENDING: "bg-amber-400/10 text-amber-400",
    COMPLETED: "bg-blue-500/10 text-blue-400",
    CANCELLED: "bg-red-500/10 text-red-400",
    NO_SHOW: "bg-orange-500/10 text-orange-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "bg-zinc-800 text-zinc-400"}`}>{status}</span>;
}
