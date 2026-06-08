import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { crmApi } from "../../services/api";
import { ChevronLeft, Plus, Trash2, AlertTriangle, Shield } from "lucide-react";
import { useConfirm } from "../../components/ui";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function AdminCRM() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [msg, setMsg] = useState("");
  const { confirm, dialog } = useConfirm();

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const { data: res } = await crmApi.getMemberCRM(Number(id));
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await crmApi.addNote(Number(id), newNote.trim());
    setNewNote("");
    setMsg("Note ajoutee");
    loadData();
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteNote = (noteId: number) => {
    confirm("Supprimer cette note ?", async () => {
      await crmApi.deleteNote(noteId);
      loadData();
    }, { title: "Supprimer", variant: "danger", confirmLabel: "Supprimer" });
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement fiche CRM...</div>;
  if (!data) return <div className="text-center py-10 text-red-400">Membre introuvable</div>;

  const risk = data.risk;
  const riskColor = risk.level === "HIGH" ? "text-red-400 bg-red-500/10" : risk.level === "MEDIUM" ? "text-amber-400 bg-amber-400/10" : "text-green-400 bg-green-500/10";

  return (
    <div>
      {dialog}
      <button onClick={() => navigate(`/g/${slug}/admin/membres`)} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-4">
        <ChevronLeft size={16} /> Retour aux membres
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{data.profile.full_name}</h1>
          <div className="text-sm text-zinc-400">{data.profile.role} &middot; <span className="font-mono text-amber-400">{data.profile.member_code}</span> &middot; {data.profile.email || data.profile.phone}</div>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold text-sm ${riskColor}`}>
          <AlertTriangle size={14} className="inline mr-1" />
          Risque : {risk.level} ({risk.score}/100)
        </div>
      </div>

      {msg && <div className="bg-green-500/10 text-green-400 rounded-xl p-3 mb-4 text-sm">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Colonne gauche */}
        <div className="space-y-5">
          {/* Abonnement */}
          <Section titre="Abonnement">
            {data.subscription ? (
              <div className="space-y-1 text-sm">
                <Row label="Plan" value={data.subscription.plan_name} highlight />
                <Row label="Debut" value={new Date(data.subscription.start_date).toLocaleDateString("fr-FR")} />
                <Row label="Expiration" value={new Date(data.subscription.end_date).toLocaleDateString("fr-FR")} />
                <Row label="Statut" value={data.subscription.status} />
              </div>
            ) : <p className="text-zinc-500 text-sm">Aucun abonnement actif</p>}
          </Section>

          {/* Paiements */}
          <Section titre="Paiements">
            <div className="space-y-1 text-sm">
              <Row label="Total paye" value={fmt(Number(data.payments.total_paid))} highlight />
              <Row label="En attente" value={`${data.payments.pending_count} paiement(s)`} />
            </div>
          </Section>

          {/* Reservations */}
          <Section titre="Reservations">
            <div className="space-y-1 text-sm">
              <Row label="Total" value={data.reservations.total} />
              <Row label="Completees" value={data.reservations.completed} />
              <Row label="Annulees" value={data.reservations.cancelled} />
              <Row label="Absences" value={data.reservations.no_show} />
            </div>
          </Section>

          {/* Presences */}
          <Section titre="Presences">
            <div className="space-y-1 text-sm">
              <Row label="Total visites" value={data.attendance.total_visits} />
              <Row label="Derniere visite" value={data.attendance.last_visit ? new Date(data.attendance.last_visit).toLocaleString("fr-FR") : "Jamais"} />
            </div>
          </Section>

          {/* Facteurs de risque */}
          <Section titre="Facteurs de risque">
            <div className="space-y-1 text-sm">
              <Row label="Derniere visite" value={risk.factors.days_since_last_visit !== null ? `Il y a ${risk.factors.days_since_last_visit} jour(s)` : "Jamais"} />
              <Row label="Abo expire dans" value={risk.factors.subscription_days_left !== null ? `${risk.factors.subscription_days_left} jour(s)` : "Aucun abo"} />
              <Row label="Paiements en retard" value={risk.factors.pending_payments} />
              <Row label="Taux annulation" value={`${risk.factors.cancellation_rate}%`} />
              <Row label="Seances 30 jours" value={risk.factors.total_sessions_30d} />
            </div>
          </Section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Progression */}
          <Section titre="Progression recente">
            {data.progress.length === 0 ? <p className="text-zinc-500 text-sm">Aucune mesure</p> : (
              <div className="space-y-2">
                {data.progress.map((p: any) => (
                  <div key={p.id} className="bg-zinc-950 rounded-lg p-2 text-xs">
                    <span className="text-zinc-500">{new Date(p.recorded_at).toLocaleDateString("fr-FR")}</span>
                    {p.weight && <span className="ml-2">{Number(p.weight)}kg</span>}
                    {p.body_fat && <span className="ml-2">{Number(p.body_fat)}%</span>}
                    {p.goal && <span className="ml-2 text-amber-400">{p.goal}</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Notes internes */}
          <Section titre="Notes internes">
            <div className="flex gap-2 mb-3">
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ajouter une note..."
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              <button onClick={addNote} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 px-3 py-2 rounded-lg"><Plus size={16} /></button>
            </div>
            {data.notes.length === 0 ? <p className="text-zinc-500 text-sm">Aucune note</p> : (
              <div className="space-y-2">
                {data.notes.map((n: any) => (
                  <div key={n.id} className="bg-zinc-950 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm">{n.note}</div>
                      <div className="text-xs text-zinc-600 mt-1">{n.admin_name} &middot; {new Date(n.created_at).toLocaleString("fr-FR")}</div>
                    </div>
                    <button onClick={() => deleteNote(n.id)} className="text-zinc-600 hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Historique actions */}
          <Section titre="Historique des actions">
            {data.activity_logs.length === 0 ? <p className="text-zinc-500 text-sm">Aucune action</p> : (
              <div className="space-y-1">
                {data.activity_logs.map((log: any, i: number) => (
                  <div key={i} className="text-xs text-zinc-500 py-1 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-400 font-medium">{log.action}</span> &middot; {log.description}
                    <span className="block text-zinc-600">{new Date(log.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold mb-3">{titre}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-zinc-400">{label}</span>
      <span className={highlight ? "font-bold text-amber-400" : ""}>{String(value)}</span>
    </div>
  );
}
